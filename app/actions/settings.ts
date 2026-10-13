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
    const { error } = await client
      .from('site_settings')
      .upsert({ id: 1, settings: clean, updated_at: new Date().toISOString(), updated_by: user.id })
    if (error) return { ok: false, error: error.message }

    updateTag(SITE_SETTINGS_TAG)
    return { ok: true, settings: clean }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not save settings.' }
  }
}
