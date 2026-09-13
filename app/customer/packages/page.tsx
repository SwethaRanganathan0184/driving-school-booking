'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Package = {
  id: string
  package_type: 'single' | 'ten_pack'
  classes_total: number
  classes_completed: number
  price_per_class: number
  status: string
  instructor_id: string
}

type Booking = {
  id: string
  package_id: string
  slot_start: string
  slot_end: string
  status: string
}

export default function CustomerPackagesPage() {
  const router = useRouter()
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<Record<string, Booking[]>>({})
  const [instructorNames, setInstructorNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPackages = useCallback(async (id: string) => {
    const { data: packageRows } = await supabase
      .from('packages')
      .select('id, package_type, classes_total, classes_completed, price_per_class, status, instructor_id')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })

    const packagesList = (packageRows ?? []) as Package[]
    setPackages(packagesList)

    const packageIds = packagesList.map((p) => p.id)
    if (packageIds.length > 0) {
      const { data: bookingRows } = await supabase
        .from('bookings')
        .select('id, package_id, slot_start, slot_end, status')
        .in('package_id', packageIds)
        .eq('status', 'confirmed')
        .order('slot_start')

      const now = new Date()
      const grouped: Record<string, Booking[]> = {}
      ;(bookingRows ?? []).forEach((b) => {
        if (new Date(b.slot_start) > now) {
          if (!grouped[b.package_id]) grouped[b.package_id] = []
          grouped[b.package_id].push(b as Booking)
        }
      })
      setUpcomingBookings(grouped)
    }

    const instructorIds = [...new Set(packagesList.map((p) => p.instructor_id))]
    if (instructorIds.length === 0) return

    const { data: instructorRows } = await supabase
      .from('instructors')
      .select('id, profiles(full_name)')
      .in('id', instructorIds)

    const nameMap: Record<string, string> = {}
    ;(instructorRows ?? []).forEach((i) => {
      const profile = i.profiles as unknown as { full_name: string | null } | null
      nameMap[i.id] = profile?.full_name ?? 'Instructor'
    })
    setInstructorNames(nameMap)
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }
      setCustomerId(sessionData.session.user.id)
      await loadPackages(sessionData.session.user.id)
      setLoading(false)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCancelPackage = async (pkg: Package) => {
    if (!customerId) return

    const confirmed = window.confirm(
      pkg.classes_completed > 0
        ? `Cancel this package? You'll owe for the ${pkg.classes_completed} class(es) already completed (₹${pkg.classes_completed * pkg.price_per_class}).`
        : 'Cancel this package? No classes have been completed yet, so nothing will be owed.'
    )
    if (!confirmed) return

    setActionKey(pkg.id)
    setError(null)

    const { error: packageError } = await supabase
      .from('packages')
      .update({ status: 'cancelled' })
      .eq('id', pkg.id)

    if (packageError) {
      setError(packageError.message)
      setActionKey(null)
      return
    }

    const futureIds = (upcomingBookings[pkg.id] ?? []).map((b) => b.id)
    if (futureIds.length > 0) {
      await supabase.from('bookings').update({ status: 'cancelled' }).in('id', futureIds)
    }

    if (pkg.classes_completed > 0) {
      await supabase.from('payments').insert({
        package_id: pkg.id,
        amount: pkg.classes_completed * pkg.price_per_class,
      })
    }

    setActionKey(null)
    await loadPackages(customerId)
  }

  const handleCancelBooking = async (booking: Booking, pkg: Package) => {
    if (!customerId) return

    const confirmed = window.confirm(
      `Cancel this class on ${new Date(booking.slot_start).toLocaleDateString()} at ${new Date(
        booking.slot_start
      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}?`
    )
    if (!confirmed) return

    setActionKey(booking.id)
    setError(null)

    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id)

    if (bookingError) {
      setError(bookingError.message)
      setActionKey(null)
      return
    }

    // A single-class package only ever has one booking — cancelling it
    // means the whole package is done, and nothing was completed, so nothing is owed.
    if (pkg.package_type === 'single') {
      await supabase.from('packages').update({ status: 'cancelled' }).eq('id', pkg.id)
    }

    setActionKey(null)
    await loadPackages(customerId)
  }

  if (loading) return <p className="text-center mt-16 text-[#47526B]">Loading...</p>

  const statusColor = (status: string) =>
    status === 'active' ? 'text-green-700' : status === 'cancelled' ? 'text-[#B3261E]' : 'text-[#47526B]'

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F8FA] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-8">
          Your packages
        </h1>

        {error && <p className="text-sm text-[#B3261E] mb-4">{error}</p>}
        {packages.length === 0 && <p className="text-base text-[#47526B]">No packages yet.</p>}

        <ul className="space-y-3">
          {packages.map((pkg) => (
            <li key={pkg.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)]">
                  {instructorNames[pkg.instructor_id] ?? 'Instructor'}
                </span>
                <span className={`text-sm font-medium ${statusColor(pkg.status)}`}>{pkg.status}</span>
              </div>
              <p className="text-base text-[#47526B] mt-1">
                {pkg.package_type === 'single' ? 'Single class' : '10-class package'}
              </p>
              {pkg.package_type === 'ten_pack' && (
                <p className="text-base text-[#47526B]">
                  {pkg.classes_completed}/{pkg.classes_total} classes completed
                </p>
              )}

              {/* Upcoming, not-yet-happened classes under this package */}
              {(upcomingBookings[pkg.id] ?? []).length > 0 && pkg.status === 'active' && (
                <div className="mt-3 space-y-2">
                  {upcomingBookings[pkg.id].map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between bg-[#F7F8FA] rounded-md px-3 py-2"
                    >
                      <span className="text-sm text-[#16213E]">
                        {new Date(booking.slot_start).toLocaleDateString()}{' '}
                        {new Date(booking.slot_start).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        type="button"
                        disabled={actionKey === booking.id}
                        onClick={() => handleCancelBooking(booking, pkg)}
                        className="text-xs text-[#B3261E] hover:underline disabled:opacity-60"
                      >
                        {actionKey === booking.id ? 'Cancelling...' : 'Cancel this class'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {pkg.package_type === 'ten_pack' && pkg.status === 'active' && (
                <button
                  type="button"
                  disabled={actionKey === pkg.id}
                  onClick={() => handleCancelPackage(pkg)}
                  className="mt-3 text-sm rounded-md border border-[#B3261E] text-[#B3261E] px-3 py-1.5 hover:bg-[#B3261E] hover:text-white transition-colors disabled:opacity-60"
                >
                  {actionKey === pkg.id ? 'Cancelling...' : 'Cancel entire package'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}