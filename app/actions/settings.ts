'use server'

import { updateTag } from 'next/cache'
import { requireAdmin } from '@/lib/supabaseServer'
import { SITE_SETTINGS_TAG } from '@/lib/siteSettings'
import { mergeSettings, type SiteSettings } from '@/lib/theme'

/** Saves the Studio settings for every visitor. RLS also rejects non-admins at the database. */
export async function publishSettings(
  accessToken: string,
  settings: SiteSettings
): Promise<{ ok: true; settings: SiteSettings } | { ok: false; error: string }> {
  try {
    const { client, user } = await requireAdmin(accessToken)
    const clean = mergeSettings(settings)
    // A plain update, not an upsert: the migration seeds row 1 and only grants admins UPDATE.
    // Postgres checks INSERT policies on every upsert, so an upsert is always rejected by RLS.
    const { data, error } = await client
      .from('site_settings')
      .update({ settings: clean, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', 1)
      .select('id')
    if (error) return { ok: false, error: error.message }
    // RLS filters rows silently, so a blocked or missing row shows up as zero rows, not an error.
    if (!data?.length) {
      return { ok: false, error: 'Settings row not found or not writable. Re-run the Supabase migration and check your admin role.' }
    }

    updateTag(SITE_SETTINGS_TAG)
    return { ok: true, settings: clean }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not save settings.' }
  }
}
