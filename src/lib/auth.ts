import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function requireAuth() {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireGuest() {
  const user = await getAuthUser()

  if (user) {
    redirect('/dashboard')
  }
}
