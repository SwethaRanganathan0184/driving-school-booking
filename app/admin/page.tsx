'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Profile = {
  id: string
  full_name: string | null
  role: string
}

type Package = {
  id: string
  package_type: 'single' | 'ten_pack'
  customer_id: string
  instructor_id: string
}

type Payment = {
  package_id: string
  amount: number
  status: 'pending' | 'paid'
}

type BookingRow = {
  id: string
  slot_start: string
  status: string
  package_id: string
}

type AdminBookingRow = {
  id: string
  slotStart: string
  bookingStatus: string
  customerName: string
  instructorName: string
  packageType: string
  paymentAmount: number | null
  paymentStatus: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [customers, setCustomers] = useState<Profile[]>([])
  const [instructors, setInstructors] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [allBookings, setAllBookings] = useState<AdminBookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, role').order('full_name')

    const all = (data ?? []) as Profile[]
    setCustomers(all.filter((p) => p.role === 'customer'))
    setInstructors(all.filter((p) => p.role === 'instructor'))
    return all
  }, [])

  const loadAllBookings = useCallback(async (allProfiles: Profile[]) => {
    const { data: bookingRows } = await supabase
      .from('bookings')
      .select('id, slot_start, status, package_id')
      .order('slot_start', { ascending: false })

    const bookings = (bookingRows ?? []) as BookingRow[]
    if (bookings.length === 0) {
      setAllBookings([])
      return
    }

    const packageIds = [...new Set(bookings.map((b) => b.package_id))]
    const { data: packageRows } = await supabase
      .from('packages')
      .select('id, package_type, customer_id, instructor_id')
      .in('id', packageIds)

    const packageMap: Record<string, Package> = {}
    ;(packageRows ?? []).forEach((p) => {
      packageMap[p.id] = p as Package
    })

    const { data: paymentRows } = await supabase
      .from('payments')
      .select('package_id, amount, status')
      .in('package_id', packageIds)

    const paymentMap: Record<string, Payment> = {}
    ;(paymentRows ?? []).forEach((p) => {
      paymentMap[p.package_id] = p as Payment
    })

    const instructorIds = [...new Set(Object.values(packageMap).map((p) => p.instructor_id))]
    const { data: instructorRows } = await supabase
      .from('instructors')
      .select('id, profile_id')
      .in('id', instructorIds)

    const instructorProfileMap: Record<string, string> = {}
    ;(instructorRows ?? []).forEach((i) => {
      instructorProfileMap[i.id] = i.profile_id
    })

    const nameByProfileId: Record<string, string> = {}
    allProfiles.forEach((p) => {
      nameByProfileId[p.id] = p.full_name ?? 'Unnamed'
    })

    const rows: AdminBookingRow[] = bookings.map((b) => {
      const pkg = packageMap[b.package_id]
      const payment = paymentMap[b.package_id]
      const instructorProfileId = pkg ? instructorProfileMap[pkg.instructor_id] : undefined

      return {
        id: b.id,
        slotStart: b.slot_start,
        bookingStatus: b.status,
        customerName: pkg ? nameByProfileId[pkg.customer_id] ?? 'Unknown' : 'Unknown',
        instructorName: instructorProfileId ? nameByProfileId[instructorProfileId] ?? 'Unknown' : 'Unknown',
        packageType: pkg?.package_type === 'ten_pack' ? '10-class' : 'Single',
        paymentAmount: payment?.amount ?? null,
        paymentStatus: payment?.status ?? null,
      }
    })

    setAllBookings(rows)
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
      const allProfiles = await loadProfiles()
      await loadAllBookings(allProfiles)
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

    const allProfiles = await loadProfiles()
    await loadAllBookings(allProfiles)
  }

  const filteredCustomers = customers.filter((c) =>
    (c.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (status: string) => {
    if (status === 'confirmed') return 'text-green-700'
    if (status === 'completed') return 'text-[#16213E]'
    if (status === 'cancelled') return 'text-[#B3261E]'
    return 'text-[#47526B]'
  }

  if (loading) return <p className="text-center mt-16 text-[#47526B]">Loading...</p>

  if (!authorized) {
    return <p className="text-center mt-16 text-[#B3261E]">{error}</p>
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F8FA] px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-8">
          Admin
        </h1>

        {error && <p className="text-[#B3261E] mb-4">{error}</p>}

        <section className="mb-10 max-w-2xl">
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

        <section className="mb-12 max-w-2xl">
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

        <section>
          <h2 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] mb-3">
            All bookings
          </h2>
          {allBookings.length === 0 ? (
            <p className="text-base text-[#47526B]">No bookings yet.</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold text-[#16213E] whitespace-nowrap">Customer</th>
                    <th className="px-4 py-3 font-semibold text-[#16213E] whitespace-nowrap">Instructor</th>
                    <th className="px-4 py-3 font-semibold text-[#16213E] whitespace-nowrap">Date & time</th>
                    <th className="px-4 py-3 font-semibold text-[#16213E] whitespace-nowrap">Package</th>
                    <th className="px-4 py-3 font-semibold text-[#16213E] whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-semibold text-[#16213E] whitespace-nowrap">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 text-[#16213E] whitespace-nowrap">{row.customerName}</td>
                      <td className="px-4 py-3 text-[#16213E] whitespace-nowrap">{row.instructorName}</td>
                      <td className="px-4 py-3 text-[#47526B] whitespace-nowrap">
                        {new Date(row.slotStart).toLocaleDateString()}{' '}
                        {new Date(row.slotStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-[#47526B] whitespace-nowrap">{row.packageType}</td>
                      <td className={`px-4 py-3 font-medium whitespace-nowrap ${statusColor(row.bookingStatus)}`}>
                        {row.bookingStatus}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.paymentAmount !== null ? (
                          <span
                            className={row.paymentStatus === 'paid' ? 'text-green-700' : 'text-[#B3261E]'}
                          >
                            ₹{row.paymentAmount} — {row.paymentStatus}
                          </span>
                        ) : (
                          <span className="text-[#47526B]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}