import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabaseClient'

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } }

/** Acts as the signed-in user (RLS applies), using the access token the browser sent. */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...NO_SESSION,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

/** Bypasses RLS. Server only; requires SUPABASE_SERVICE_ROLE_KEY. */
export function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set on the server.')
  return createClient(SUPABASE_URL, key, NO_SESSION)
}

/** Verifies the token belongs to an admin. Throws otherwise. */
export async function requireAdmin(accessToken: string) {
  if (!accessToken) throw new Error('Not signed in.')
  const client = userClient(accessToken)
  const { data: userData, error } = await client.auth.getUser(accessToken)
  if (error || !userData.user) throw new Error('Your session has expired. Please sign in again.')

  const { data: profile } = await client.from('profiles').select('role').eq('id', userData.user.id).single()
  if (profile?.role !== 'admin') throw new Error('Admin access required.')

  return { client, user: userData.user }
}
