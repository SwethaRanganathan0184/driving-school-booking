'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Instructor = {
  id: string
  bio: string | null
  photo_url: string | null
  profiles: { full_name: string | null } | null
}

export default function CustomerHomePage() {
  const router = useRouter()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('instructors')
        .select('id, bio, photo_url, profiles(full_name)')

      if (!error && data) {
        setInstructors(data as unknown as Instructor[])
      }
      setLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <p className="text-center mt-16 text-[#47526B]">Loading...</p>

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F8FA] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-8">
          Choose an instructor
        </h1>

        {instructors.length === 0 && (
          <p className="text-base text-[#47526B]">No instructors available yet.</p>
        )}

        <ul className="space-y-4">
          {instructors.map((instructor) => (
            <li
              key={instructor.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                {instructor.photo_url ? (
                  <img
                    src={instructor.photo_url}
                    alt={instructor.profiles?.full_name ?? 'Instructor'}
                    className="w-14 h-14 rounded-full object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-[#47526B] shrink-0">
                    No photo
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)]">
                    {instructor.profiles?.full_name ?? 'Instructor'}
                  </h3>
                  <p className="text-base text-[#47526B] mt-1">{instructor.bio || 'No bio yet.'}</p>
                </div>
              </div>
              <Link
                href={`/customer/instructor/${instructor.id}`}
                className="shrink-0 rounded-md bg-[#B8912F] text-[#16213E] text-sm font-medium px-4 py-2 text-center hover:bg-[#A57F27] transition-colors"
              >
                Book a class
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}