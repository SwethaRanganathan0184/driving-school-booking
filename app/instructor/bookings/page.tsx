'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { AlertCircle, CalendarClock, CheckCircle2, History, IndianRupee, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useInstructor } from '@/lib/useInstructor'
import { formatSlot } from '@/lib/instructors'
import { useMotionProfile } from '@/lib/motion'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Alert, Badge } from '../../components/ui/Feedback'
import { EmptyState, Page, PageLoading, PageMessage } from '../../components/ui/Page'
import { Tabs } from '../../components/ui/Tabs'

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

type Customer = { name: string; phone: string | null }
type Tab = 'action' | 'upcoming' | 'history'

type Appointments = {
  bookings: Booking[]
  packages: Record<string, Package>
  payments: Record<string, Payment>
  customers: Record<string, Customer>
}

async function fetchAppointments(instructorId: string): Promise<Appointments> {
  const { data: bookingRows } = await supabase
    .from('bookings')
    .select('id, slot_start, slot_end, status, package_id')
    .eq('instructor_id', instructorId)
    .order('slot_start', { ascending: false })

  const bookings = (bookingRows ?? []) as Booking[]
  const result: Appointments = { bookings, packages: {}, payments: {}, customers: {} }
  const packageIds = [...new Set(bookings.map((b) => b.package_id))]
  if (packageIds.length === 0) return result

  const { data: packageRows } = await supabase
    .from('packages')
    .select('id, package_type, classes_total, classes_completed, price_per_class, status, customer_id')
    .in('id', packageIds)
  ;(packageRows ?? []).forEach((p) => {
    result.packages[p.id] = p as Package
  })

  const { data: paymentRows } = await supabase
    .from('payments')
    .select('id, package_id, amount, status')
    .in('package_id', packageIds)
  ;(paymentRows ?? []).forEach((p) => {
    result.payments[p.package_id] = p as Payment
  })

  const customerIds = [...new Set((packageRows ?? []).map((p) => p.customer_id))]
  if (customerIds.length > 0) {
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number')
      .in('id', customerIds)
    ;(profileRows ?? []).forEach((p) => {
      result.customers[p.id] = { name: p.full_name ?? 'Customer', phone: p.phone_number ?? null }
    })
  }
  return result
}

export default function InstructorBookingsPage() {
  const inst = useInstructor()
  const m = useMotionProfile()
  const instructorId = inst.status === 'ready' ? inst.instructorId : null
  const [bookings, setBookings] = useState<Booking[]>([])
  const [packages, setPackages] = useState<Record<string, Package>>({})
  const [payments, setPayments] = useState<Record<string, Payment>>({})
  const [customers, setCustomers] = useState<Record<string, Customer>>({})
  const [loading, setLoading] = useState(true)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('action')

  const [now] = useState(() => Date.now())

  const apply = useCallback((d: Appointments) => {
    setBookings(d.bookings)
    setPackages(d.packages)
    setPayments(d.payments)
    setCustomers(d.customers)
  }, [])

  const loadBookings = async (id: string) => apply(await fetchAppointments(id))

  useEffect(() => {
    if (!instructorId) return
    let active = true
    fetchAppointments(instructorId).then((d) => {
      if (!active) return
      apply(d)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [instructorId, apply])

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

  if (inst.status === 'denied') return <PageMessage title="Instructor area">{inst.message}</PageMessage>
  if (inst.status !== 'ready' || loading) return <PageLoading />

  const isPast = (b: Booking) => new Date(b.slot_start).getTime() <= now
  const pendingPayment = (b: Booking) => {
    const p = payments[b.package_id]
    return p && p.status === 'pending' ? p : undefined
  }
  const needsAction = bookings.filter((b) => (b.status === 'confirmed' && isPast(b)) || (b.status === 'completed' && pendingPayment(b)))
  // De-duplicate: a 10-class package's single pending payment should show once.
  const seenPayments = new Set<string>()
  const actionList = needsAction.filter((b) => {
    if (b.status === 'confirmed') return true
    const p = pendingPayment(b)!
    if (seenPayments.has(p.id)) return false
    seenPayments.add(p.id)
    return true
  })
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && !isPast(b)).reverse()
  const history = bookings.filter((b) => b.status !== 'confirmed')

  const list = tab === 'action' ? actionList : tab === 'upcoming' ? upcoming : history

  return (
    <Page title="Appointments" subtitle="Mark lessons complete after they happen and record payments." width="md">
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { id: 'action', label: 'Needs action', icon: AlertCircle, count: actionList.length },
          { id: 'upcoming', label: 'Upcoming', icon: CalendarClock, count: upcoming.length },
          { id: 'history', label: 'History', icon: History, count: history.length },
        ]}
      />
      <Alert>{error}</Alert>

      {list.length === 0 ? (
        <EmptyState
          icon={tab === 'action' ? CheckCircle2 : CalendarClock}
          title={tab === 'action' ? "You're all caught up" : tab === 'upcoming' ? 'No upcoming lessons' : 'No history yet'}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((booking, i) => {
            const pkg = packages[booking.package_id]
            const payment = pkg ? payments[pkg.id] : undefined
            const customer = customers[pkg?.customer_id ?? '']
            const canComplete = booking.status === 'confirmed' && isPast(booking)

            return (
              <motion.li
                key={booking.id}
                initial={m.enabled ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: m.duration(Math.min(i, 8) * 0.05), duration: m.duration(0.35) }}
              >
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-bold text-fg">{customer?.name ?? 'Customer'}</p>
                      <p className="text-sm text-muted">{formatSlot(booking.slot_start)}</p>
                      {customer?.phone && (
                        <a href={`tel:${customer.phone}`} className="text-sm text-accent inline-flex items-center gap-1 mt-1 hover:underline">
                          <Phone className="size-3.5" aria-hidden />{customer.phone}
                        </a>
                      )}
                    </div>
                    <Badge status={booking.status} />
                  </div>
                  {pkg?.package_type === 'ten_pack' && (
                    <p className="text-xs text-muted mt-2">10-class package · {pkg.classes_completed}/{pkg.classes_total} completed</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    {canComplete && (
                      <Button size="sm" icon={CheckCircle2} loading={actionKey === booking.id} onClick={() => handleMarkComplete(booking)}>
                        Mark completed
                      </Button>
                    )}
                    {payment && (
                      <span className={`text-sm inline-flex items-center gap-1 ${payment.status === 'pending' ? 'text-danger' : 'text-success'}`}>
                        <IndianRupee className="size-3.5" aria-hidden />{payment.amount} · {payment.status}
                      </span>
                    )}
                    {payment?.status === 'pending' && (
                      <Button size="sm" variant="secondary" loading={actionKey === payment.id} onClick={() => handleMarkPaid(payment)}>
                        Mark as paid
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
