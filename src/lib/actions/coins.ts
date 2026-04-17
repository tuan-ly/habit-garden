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
 * Award coins to user — atomic via PostgreSQL RPC
 * Single transaction: UPDATE coins + INSERT transaction log
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

  const { data, error } = await supabase.rpc('award_coins', {
    p_user_id: user.id,
    p_amount: amount,
    p_reason: reason,
    p_reference_id: referenceId ?? null,
  })

  if (error) return { error: error.message }
  return { newBalance: data as number }
}

/**
 * Spend coins — atomic via PostgreSQL RPC
 * Single transaction: check balance + UPDATE coins + INSERT transaction log
 * Fails atomically if insufficient balance (no partial state)
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

  const { data, error } = await supabase.rpc('spend_coins', {
    p_user_id: user.id,
    p_amount: amount,
    p_reason: reason,
    p_reference_id: referenceId ?? null,
  })

  if (error) {
    // Map PostgreSQL exception to user-friendly message
    if (error.message.includes('Insufficient coins')) {
      return { error: 'Not enough coins' }
    }
    return { error: error.message }
  }

  return { newBalance: data as number }
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
