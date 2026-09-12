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

export default function CustomerPackagesPage() {
  const router = useRouter()
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
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

  const handleCancel = async (pkg: Package) => {
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

    const { data: futureBookings } = await supabase
      .from('bookings')
      .select('id, slot_start')
      .eq('package_id', pkg.id)
      .eq('status', 'confirmed')

    const now = new Date()
    const futureBookingIds = (futureBookings ?? [])
      .filter((b) => new Date(b.slot_start) > now)
      .map((b) => b.id)

    if (futureBookingIds.length > 0) {
      await supabase.from('bookings').update({ status: 'cancelled' }).in('id', futureBookingIds)
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
              {pkg.package_type === 'ten_pack' && pkg.status === 'active' && (
                <button
                  type="button"
                  disabled={actionKey === pkg.id}
                  onClick={() => handleCancel(pkg)}
                  className="mt-3 text-sm rounded-md border border-[#B3261E] text-[#B3261E] px-3 py-1.5 hover:bg-[#B3261E] hover:text-white transition-colors disabled:opacity-60"
                >
                  {actionKey === pkg.id ? 'Cancelling...' : 'Cancel package'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}