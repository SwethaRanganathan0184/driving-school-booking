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
  customer_id: string
}

type Payment = {
  id: string
  package_id: string
  amount: number
  status: 'pending' | 'paid'
}

type Booking = {
  id: string
  slot_start: string
  slot_end: string
  status: string
  package_id: string
}

export default function InstructorBookingsPage() {
  const router = useRouter()
  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [packages, setPackages] = useState<Record<string, Package>>({})
  const [payments, setPayments] = useState<Record<string, Payment>>({})
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadBookings = useCallback(async (id: string) => {
    const { data: bookingRows } = await supabase
      .from('bookings')
      .select('id, slot_start, slot_end, status, package_id')
      .eq('instructor_id', id)
      .order('slot_start', { ascending: false })

    const bookingsList = (bookingRows ?? []) as Booking[]
    setBookings(bookingsList)

    const packageIds = [...new Set(bookingsList.map((b) => b.package_id))]
    if (packageIds.length === 0) {
      setPackages({})
      setPayments({})
      setCustomerNames({})
      return
    }

    const { data: packageRows } = await supabase
      .from('packages')
      .select('id, package_type, classes_total, classes_completed, price_per_class, status, customer_id')
      .in('id', packageIds)

    const packageMap: Record<string, Package> = {}
    ;(packageRows ?? []).forEach((p) => {
      packageMap[p.id] = p as Package
    })
    setPackages(packageMap)

    const { data: paymentRows } = await supabase
      .from('payments')
      .select('id, package_id, amount, status')
      .in('package_id', packageIds)

    const paymentMap: Record<string, Payment> = {}
    ;(paymentRows ?? []).forEach((p) => {
      paymentMap[p.package_id] = p as Payment
    })
    setPayments(paymentMap)

    const customerIds = [...new Set((packageRows ?? []).map((p) => p.customer_id))]
    if (customerIds.length > 0) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', customerIds)

      const nameMap: Record<string, string> = {}
      ;(profileRows ?? []).forEach((p) => {
        nameMap[p.id] = p.full_name ?? 'Customer'
      })
      setCustomerNames(nameMap)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const { data: instructor, error: instructorError } = await supabase
        .from('instructors')
        .select('id')
        .eq('profile_id', sessionData.session.user.id)
        .single()

      if (instructorError || !instructor) {
        setError('This account is not set up as an instructor yet.')
        setLoading(false)
        return
      }

      setInstructorId(instructor.id)
      await loadBookings(instructor.id)
      setLoading(false)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMarkComplete = async (booking: Booking) => {
    if (!instructorId) return
    setActionKey(booking.id)
    setError(null)

    const pkg = packages[booking.package_id]
    if (!pkg) {
      setError('Could not find the package for this booking.')
      setActionKey(null)
      return
    }

    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', booking.id)

    if (bookingUpdateError) {
      setError(bookingUpdateError.message)
      setActionKey(null)
      return
    }

    if (pkg.package_type === 'single') {
      await supabase.from('payments').insert({
        package_id: pkg.id,
        amount: pkg.price_per_class,
      })
      await supabase.from('packages').update({ status: 'completed' }).eq('id', pkg.id)
    } else {
      const newCompleted = pkg.classes_completed + 1
      await supabase.from('packages').update({ classes_completed: newCompleted }).eq('id', pkg.id)

      if (newCompleted >= pkg.classes_total) {
        await supabase.from('payments').insert({
          package_id: pkg.id,
          amount: pkg.price_per_class * pkg.classes_total,
        })
        await supabase.from('packages').update({ status: 'completed' }).eq('id', pkg.id)
      }
    }

    setActionKey(null)
    await loadBookings(instructorId)
  }

  const handleMarkPaid = async (payment: Payment) => {
    if (!instructorId) return
    setActionKey(payment.id)
    setError(null)

    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ status: 'paid' })
      .eq('id', payment.id)

    setActionKey(null)

    if (paymentUpdateError) {
      setError(paymentUpdateError.message)
      return
    }

    await loadBookings(instructorId)
  }

  if (loading) return <p className="text-center mt-16 text-[#47526B]">Loading...</p>

  if (error && !instructorId) {
    return <p className="text-center mt-16 text-[#B3261E]">{error}</p>
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F8FA] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-8">
          Your bookings
        </h1>

        {error && <p className="text-sm text-[#B3261E] mb-4">{error}</p>}
        {bookings.length === 0 && <p className="text-base text-[#47526B]">No bookings yet.</p>}

        <ul className="space-y-3">
          {bookings.map((booking) => {
            const pkg = packages[booking.package_id]
            const payment = pkg ? payments[pkg.id] : undefined
            const slotStart = new Date(booking.slot_start)
            const isPast = slotStart <= new Date()
            const canComplete = booking.status === 'confirmed' && isPast

            return (
              <li key={booking.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)]">
                    {customerNames[pkg?.customer_id ?? ''] ?? 'Customer'}
                  </span>
                  <span className="text-sm text-[#47526B]">
                    {slotStart.toLocaleDateString()}{' '}
                    {slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-base text-[#47526B] mt-1">
                  Status: {booking.status}
                  {pkg && pkg.package_type === 'ten_pack' && (
                    <> — {pkg.classes_completed}/{pkg.classes_total} classes completed</>
                  )}
                </p>

                {canComplete && (
                  <button
                    type="button"
                    disabled={actionKey === booking.id}
                    onClick={() => handleMarkComplete(booking)}
                    className="mt-3 text-sm rounded-md bg-[#16213E] text-white px-3 py-1.5 hover:bg-[#0F1729] transition-colors disabled:opacity-60"
                  >
                    {actionKey === booking.id ? 'Saving...' : 'Mark completed'}
                  </button>
                )}
                {booking.status === 'confirmed' && !isPast && (
                  <p className="text-xs text-[#47526B] mt-2">
                    Can be marked completed after the class time passes.
                  </p>
                )}

                {payment && (
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <span className={payment.status === 'pending' ? 'text-[#B3261E]' : 'text-green-700'}>
                      ₹{payment.amount} — {payment.status}
                    </span>
                    {payment.status === 'pending' && (
                      <button
                        type="button"
                        disabled={actionKey === payment.id}
                        onClick={() => handleMarkPaid(payment)}
                        className="rounded-md border border-[#16213E] text-[#16213E] px-3 py-1 hover:bg-[#16213E] hover:text-white transition-colors disabled:opacity-60"
                      >
                        {actionKey === payment.id ? 'Saving...' : 'Mark as paid'}
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}