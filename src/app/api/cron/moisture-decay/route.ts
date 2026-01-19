import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getTodayWeather, calculateWeatherMoistureDecay } from '@/lib/weather-system'

// This route is called by a cron job to decay moisture for all plants
// and mark plants with 0% moisture as dead

export async function GET(request: NextRequest) {
  // Verify the request is from a cron job (optional security)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no CRON_SECRET is set
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Get today's weather for moisture decay modifier
    const weather = getTodayWeather()

    // Get all growing plants with their plant type info
    const { data: plants, error: plantsError } = await supabase
      .from('plants')
      .select(`
        id,
        user_id,
        name,
        current_moisture,
        current_streak,
        last_watered_at,
        updated_at,
        plant_type:plant_types(moisture_decay_rate)
      `)
      .eq('status', 'growing')

    if (plantsError) {
      console.error('Error fetching plants:', plantsError)
      return NextResponse.json({ error: plantsError.message }, { status: 500 })
    }

    if (!plants || plants.length === 0) {
      return NextResponse.json({ message: 'No plants to process', processed: 0 })
    }

    const today = new Date().toISOString().split('T')[0]
    const results = {
      processed: 0,
      skipped: 0,
      decayed: 0,
      died: 0,
      streaksReset: 0,
    }

    for (const plant of plants) {
      const plantType = Array.isArray(plant.plant_type)
        ? plant.plant_type[0]
        : plant.plant_type

      if (!plantType) continue

      // Idempotency check: Skip if user already watered today
      // IMPORTANT: Use last_watered_at as the primary check, NOT updated_at
      // updated_at can be stale or not set properly on plant creation
      // last_watered_at is the definitive source of truth for watering
      const lastWateredDate = plant.last_watered_at
        ? new Date(plant.last_watered_at).toISOString().split('T')[0]
        : null

      if (lastWateredDate === today) {
        // User already watered today - they completed their habit!
        console.log(`Plant ${plant.id} (${plant.name}) watered today, skipping decay`)
        results.skipped++
        continue
      }

      // Also check if this cron already processed this plant today
      // by checking if updated_at is today AND moisture was already decayed
      // (last_watered_at would be yesterday or earlier)
      const updatedDate = plant.updated_at
        ? new Date(plant.updated_at).toISOString().split('T')[0]
        : null

      if (updatedDate === today && lastWateredDate !== today) {
        // Cron already ran today and decayed this plant
        console.log(`Plant ${plant.id} (${plant.name}) already processed by cron today, skipping`)
        results.skipped++
        continue
      }

      // Calculate base decay rate (default 10% per day)
      const baseDecayRate = plantType.moisture_decay_rate || 10

      // Apply weather modifier to decay
      const adjustedDecay = calculateWeatherMoistureDecay(baseDecayRate, weather.type)

      // Calculate new moisture
      const newMoisture = Math.max(0, plant.current_moisture - adjustedDecay)

      // Check if plant should die
      const shouldDie = newMoisture <= 0

      // Check if streak should be reset (not watered today or yesterday)
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const shouldResetStreak = lastWateredDate !== today && lastWateredDate !== yesterday

      // Prepare update data
      const updateData: Record<string, unknown> = {
        current_moisture: newMoisture,
        updated_at: new Date().toISOString(),
      }

      if (shouldDie) {
        updateData.status = 'dead'
        updateData.died_at = new Date().toISOString()
        updateData.death_reason = 'Moisture reached 0% - plant was not watered'
        updateData.current_streak = 0
        results.died++
      } else if (shouldResetStreak && plant.current_streak > 0) {
        updateData.current_streak = 0
        results.streaksReset++
      }

      // Update the plant
      const { error: updateError } = await supabase
        .from('plants')
        .update(updateData)
        .eq('id', plant.id)

      if (updateError) {
        console.error(`Error updating plant ${plant.id}:`, updateError)
      } else {
        results.processed++
        if (!shouldDie && newMoisture < plant.current_moisture) {
          results.decayed++
        }
      }
    }

    console.log(`Moisture decay completed:`, {
      date: today,
      weather: weather.type,
      totalPlants: plants.length,
      ...results,
    })

    return NextResponse.json({
      success: true,
      date: today,
      weather: weather.type,
      totalPlants: plants.length,
      ...results,
    })
  } catch (error) {
    console.error('Moisture decay cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
