import { supabase } from './supabaseClient'

export type InstructorCard = {
  id: string
  profile_id: string
  bio: string | null
  photo_url: string | null
  experience_years: number | null
  languages: string[]
  specialties: string[]
  service_area: string | null
  active: boolean
  full_name: string
  phone_number: string | null
  rating: number | null
  review_count: number
}

const FULL = 'id, profile_id, bio, photo_url, experience_years, languages, specialties, service_area, active, profiles(full_name, phone_number)'
const BASIC = 'id, profile_id, bio, photo_url, profiles(full_name, phone_number)'

type Row = Partial<InstructorCard> & {
  id: string
  profile_id: string
  profiles: { full_name: string | null; phone_number: string | null } | null
}

/**
 * Loads instructors with their public rating. Falls back to the pre-migration columns
 * so the site keeps working if the latest SQL migration hasn't been applied yet.
 */
export async function fetchInstructors(opts: { includeInactive?: boolean; id?: string } = {}): Promise<InstructorCard[]> {
  const run = (cols: string) => {
    let q = supabase.from('instructors').select(cols)
    if (opts.id) q = q.eq('id', opts.id)
    return q
  }

  let { data, error } = await run(FULL)
  if (error) ({ data, error } = await run(BASIC))
  if (error || !data) return []

  const rows = data as unknown as Row[]
  const { data: ratings } = await supabase.from('instructor_ratings').select('instructor_id, average_rating, review_count')
  const ratingMap = new Map((ratings ?? []).map((r) => [r.instructor_id as string, r]))

  return rows
    .map((r) => {
      const rating = ratingMap.get(r.id)
      return {
        id: r.id,
        profile_id: r.profile_id,
        bio: r.bio ?? null,
        photo_url: r.photo_url ?? null,
        experience_years: r.experience_years ?? null,
        languages: r.languages ?? [],
        specialties: r.specialties ?? [],
        service_area: r.service_area ?? null,
        active: r.active ?? true,
        full_name: r.profiles?.full_name ?? 'Instructor',
        phone_number: r.profiles?.phone_number ?? null,
        rating: rating ? Number(rating.average_rating) : null,
        review_count: rating ? Number(rating.review_count) : 0,
      }
    })
    .filter((i) => opts.includeInactive || i.active)
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?'

export const splitList = (value: string) =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

export const formatSlot = (iso: string | Date) =>
  new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
