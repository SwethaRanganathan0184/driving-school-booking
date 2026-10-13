'use server'

import { requireAdmin, serviceClient } from '@/lib/supabaseServer'

export type NewInstructorInput = {
  fullName: string
  email: string
  tempPassword: string
  phone: string
  bio: string
  experienceYears: number | null
  languages: string[]
  specialties: string[]
  serviceArea: string
}

type Result = { ok: true; instructorId: string; profileId: string } | { ok: false; error: string }

/**
 * Creates a login for a new instructor. They sign in with the temporary password
 * and are asked to choose their own on first login.
 */
export async function createInstructor(accessToken: string, input: NewInstructorInput): Promise<Result> {
  try {
    await requireAdmin(accessToken)

    const email = input.email.trim().toLowerCase()
    const fullName = input.fullName.trim()
    if (!fullName) return { ok: false, error: 'Name is required.' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email address.' }
    if (input.tempPassword.length < 8) return { ok: false, error: 'Temporary password must be at least 8 characters.' }

    const admin = serviceClient()

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: input.tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone_number: input.phone.trim(), must_change_password: true },
    })
    if (createError || !created.user) {
      return { ok: false, error: createError?.message ?? 'Could not create the account.' }
    }
    const profileId = created.user.id

    // The signup trigger creates the profile row; make sure it exists and mark it as an instructor.
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({ id: profileId, full_name: fullName, phone_number: input.phone.trim() || null, role: 'instructor' })
    if (profileError) {
      await admin.auth.admin.deleteUser(profileId)
      return { ok: false, error: profileError.message }
    }

    const { data: instructor, error: instructorError } = await admin
      .from('instructors')
      .insert({
        profile_id: profileId,
        bio: input.bio.trim(),
        experience_years: input.experienceYears,
        languages: input.languages,
        specialties: input.specialties,
        service_area: input.serviceArea.trim() || null,
      })
      .select('id')
      .single()
    if (instructorError || !instructor) {
      await admin.auth.admin.deleteUser(profileId)
      return { ok: false, error: instructorError?.message ?? 'Could not create the instructor.' }
    }

    return { ok: true, instructorId: instructor.id, profileId }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not create the instructor.' }
  }
}
