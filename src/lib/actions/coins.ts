'use server'

import { getAuthUser } from '@/lib/auth-cached'
import { createClient } from '@/lib/supabase/server'

/**
 * Get user's current coin balance
 */
export async function getCoinBalance(): Promise<{ coins: number } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', user.id)
    .single()

  if (error) return { error: error.message }
  return { coins: data.coins ?? 0 }
}

/**
 * Award coins to user (internal use - called from other actions)
 */
export async function awardCoins(
  amount: number,
  reason: string,
  referenceId?: string
): Promise<{ newBalance: number } | { error: string }> {
  if (amount <= 0) return { error: 'Amount must be positive' }

  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Get current balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', user.id)
    .single()

  if (profileError) return { error: profileError.message }

  const currentBalance = profile.coins ?? 0
  const newBalance = currentBalance + amount

  // Update balance
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ coins: newBalance })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  // Log transaction
  const { error: txError } = await supabase
    .from('coin_transactions')
    .insert({
      user_id: user.id,
      amount,
      reason,
      reference_id: referenceId ?? null,
      balance_after: newBalance,
    })

  if (txError) {
    console.error('Failed to log coin transaction:', txError)
    // Don't fail the operation just because logging failed
  }

  return { newBalance }
}

/**
 * Spend coins (internal use - validates balance before spending)
 */
export async function spendCoins(
  amount: number,
  reason: string,
  referenceId?: string
): Promise<{ newBalance: number } | { error: string }> {
  if (amount <= 0) return { error: 'Amount must be positive' }

  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Get current balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('coins')
    .eq('id', user.id)
    .single()

  if (profileError) return { error: profileError.message }

  const currentBalance = profile.coins ?? 0
  if (currentBalance < amount) {
    return { error: `Not enough coins. Have ${currentBalance}, need ${amount}` }
  }

  const newBalance = currentBalance - amount

  // Update balance
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ coins: newBalance })
    .eq('id', user.id)

  if (updateError) return { error: updateError.message }

  // Log transaction (negative amount)
  const { error: txError } = await supabase
    .from('coin_transactions')
    .insert({
      user_id: user.id,
      amount: -amount,
      reason,
      reference_id: referenceId ?? null,
      balance_after: newBalance,
    })

  if (txError) {
    console.error('Failed to log coin transaction:', txError)
  }

  return { newBalance }
}

/**
 * Get recent coin transactions
 */
export async function getCoinHistory(limit: number = 20): Promise<
  {
    transactions: Array<{
      id: string
      amount: number
      reason: string
      balance_after: number
      created_at: string
    }>
  }
  | { error: string }
> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coin_transactions')
    .select('id, amount, reason, balance_after, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { error: error.message }
  return { transactions: data ?? [] }
}
