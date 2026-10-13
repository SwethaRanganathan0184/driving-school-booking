import 'server-only'
import { DEFAULT_SETTINGS, mergeSettings, type SiteSettings } from './theme'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabaseClient'

export const SITE_SETTINGS_TAG = 'site-settings'

/**
 * Published Studio settings, cached and refreshed when the admin publishes (see app/actions/settings.ts).
 * Falls back to defaults if Supabase is unreachable or the migration hasn't been run yet.
 */
export async function getPublishedSettings(): Promise<SiteSettings> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return DEFAULT_SETTINGS
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=settings`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      next: { revalidate: 3600, tags: [SITE_SETTINGS_TAG] },
    })
    if (!res.ok) return DEFAULT_SETTINGS
    const rows = (await res.json()) as { settings: unknown }[]
    return mergeSettings(rows[0]?.settings)
  } catch {
    return DEFAULT_SETTINGS
  }
}
