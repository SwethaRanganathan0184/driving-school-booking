import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in.'
  )
}

// Placeholder values keep builds from crashing when env vars are absent; requests fail loudly instead.
export const supabase = createClient(
  SUPABASE_URL || 'https://missing-env.supabase.co',
  SUPABASE_ANON_KEY || 'missing-anon-key'
)
