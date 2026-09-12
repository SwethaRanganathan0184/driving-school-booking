'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Profile = {
  id: string
  full_name: string | null
  role: string
}

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [customers, setCustomers] = useState<Profile[]>([])
  const [instructors, setInstructors] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, role').order('full_name')

    const all = (data ?? []) as Profile[]
    setCustomers(all.filter((p) => p.role === 'customer'))
    setInstructors(all.filter((p) => p.role === 'instructor'))
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionData.session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        setError('This account does not have admin access.')
        setLoading(false)
        return
      }

      setAuthorized(true)
      await loadProfiles()
      setLoading(false)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePromote = async (profile: Profile) => {
    setActionKey(profile.id)
    setError(null)

    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'instructor' })
      .eq('id', profile.id)

    if (roleError) {
      setError(roleError.message)
      setActionKey(null)
      return
    }

    const { error: instructorError } = await supabase
      .from('instructors')
      .insert({ profile_id: profile.id, bio: '' })

    setActionKey(null)

    if (instructorError) {
      setError(instructorError.message)
      return
    }

    await loadProfiles()
  }

  const filteredCustomers = customers.filter((c) =>
    (c.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <p className="text-center mt-16 text-[#47526B]">Loading...</p>

  if (!authorized) {
    return <p className="text-center mt-16 text-[#B3261E]">{error}</p>
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F8FA] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-8">
          Admin
        </h1>

        {error && <p className="text-[#B3261E] mb-4">{error}</p>}

        <section className="mb-10">
          <h2 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] mb-3">
            Current instructors
          </h2>
          {instructors.length === 0 && <p className="text-base text-[#47526B]">None yet.</p>}
          <ul className="space-y-2">
            {instructors.map((i) => (
              <li key={i.id} className="text-base text-[#16213E]">
                {i.full_name ?? 'Unnamed'}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] mb-3">
            Promote a customer to instructor
          </h2>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#B8912F]"
          />
          {filteredCustomers.length === 0 && (
            <p className="text-base text-[#47526B]">No matching customers found.</p>
          )}
          <ul className="space-y-2">
            {filteredCustomers.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between border border-gray-200 rounded-md px-3 py-2 bg-white"
              >
                <span className="text-sm text-[#16213E]">{c.full_name ?? 'Unnamed'}</span>
                <button
                  type="button"
                  disabled={actionKey === c.id}
                  onClick={() => handlePromote(c)}
                  className="text-sm rounded-md bg-[#16213E] text-white px-3 py-1.5 hover:bg-[#0F1729] transition-colors disabled:opacity-60"
                >
                  {actionKey === c.id ? 'Promoting...' : 'Make instructor'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}