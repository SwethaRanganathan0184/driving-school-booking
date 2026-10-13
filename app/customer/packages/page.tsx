'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { CalendarClock, CalendarPlus, History, Package as PackageIcon, Star, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuthGate } from '@/lib/useAuthGate'
import { formatSlot } from '@/lib/instructors'
import { useMotionProfile } from '@/lib/motion'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { ConfirmDialog, Dialog } from '../../components/ui/Dialog'
import { Textarea } from '../../components/ui/Field'
import { Alert, Badge, StarInput, Stars } from '../../components/ui/Feedback'
import { EmptyState, Page, PageLoading } from '../../components/ui/Page'
import { Tabs } from '../../components/ui/Tabs'

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

type Lessons = {
  packages: Package[]
  bookings: Booking[]
  ratings: Record<string, number>
  names: Record<string, string>
}

async function fetchLessons(customerId: string): Promise<Lessons> {
  const { data: packageRows } = await supabase
    .from('packages')
    .select('id, package_type, classes_total, classes_completed, price_per_class, status, instructor_id')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  const packages = (packageRows ?? []) as Package[]
  const result: Lessons = { packages, bookings: [], ratings: {}, names: {} }
  if (packages.length === 0) return result

  const { data: bookingRows } = await supabase
    .from('bookings')
    .select('id, package_id, slot_start, slot_end, status')
    .in('package_id', packages.map((p) => p.id))
    .order('slot_start')
  result.bookings = (bookingRows ?? []) as Booking[]

  const { data: feedbackRows } = await supabase.from('feedback').select('booking_id, rating').eq('customer_id', customerId)
  result.ratings = Object.fromEntries((feedbackRows ?? []).map((f) => [f.booking_id, f.rating]))

  const { data: instructorRows } = await supabase
    .from('instructors')
    .select('id, profiles(full_name)')
    .in('id', [...new Set(packages.map((p) => p.instructor_id))])

  ;(instructorRows ?? []).forEach((i) => {
    const profile = i.profiles as unknown as { full_name: string | null } | null
    result.names[i.id] = profile?.full_name ?? 'Instructor'
  })
  return result
}

type Tab = 'upcoming' | 'packages' | 'past'
type Pending =
  | { kind: 'package'; pkg: Package }
  | { kind: 'booking'; booking: Booking; pkg: Package }
  | null

export default function CustomerPackagesPage() {
  const gate = useAuthGate()
  const m = useMotionProfile()
  const customerId = gate.status === 'ready' ? gate.userId : null
  const [packages, setPackages] = useState<Package[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [instructorNames, setInstructorNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('upcoming')
  const [pending, setPending] = useState<Pending>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateTarget, setRateTarget] = useState<{ booking: Booking; pkg: Package } | null>(null)
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const [now] = useState(() => Date.now())

  const apply = useCallback((d: Lessons) => {
    setPackages(d.packages)
    setBookings(d.bookings)
    setRatings(d.ratings)
    setInstructorNames(d.names)
  }, [])

  const loadPackages = async (id: string) => apply(await fetchLessons(id))

  useEffect(() => {
    if (!customerId) return
    let active = true
    fetchLessons(customerId).then((d) => {
      if (!active) return
      apply(d)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [customerId, apply])

  const packageById = useMemo(() => Object.fromEntries(packages.map((p) => [p.id, p])), [packages])
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && new Date(b.slot_start).getTime() > now && packageById[b.package_id]?.status === 'active')
  const past = bookings
    .filter((b) => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.slot_start).getTime() <= now))
    .reverse()

  const handleCancelPackage = async (pkg: Package) => {
    if (!customerId) return
    setBusy(true)
    setError(null)

    const { error: packageError } = await supabase
      .from('packages')
      .update({ status: 'cancelled' })
      .eq('id', pkg.id)

    if (packageError) {
      setError(packageError.message)
      setBusy(false)
      setPending(null)
      return
    }

    const futureIds = upcoming.filter((b) => b.package_id === pkg.id).map((b) => b.id)
    if (futureIds.length > 0) {
      await supabase.from('bookings').update({ status: 'cancelled' }).in('id', futureIds)
    }

    if (pkg.classes_completed > 0) {
      await supabase.from('payments').insert({
        package_id: pkg.id,
        amount: pkg.classes_completed * pkg.price_per_class,
      })
    }

    setBusy(false)
    setPending(null)
    await loadPackages(customerId)
  }

  const handleCancelBooking = async (booking: Booking, pkg: Package) => {
    if (!customerId) return
    setBusy(true)
    setError(null)

    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id)

    if (bookingError) {
      setError(bookingError.message)
      setBusy(false)
      setPending(null)
      return
    }

    // A single-class package only ever has one booking. Cancelling it
    // means the whole package is done, and nothing was completed, so nothing is owed.
    if (pkg.package_type === 'single') {
      await supabase.from('packages').update({ status: 'cancelled' }).eq('id', pkg.id)
    }

    setBusy(false)
    setPending(null)
    await loadPackages(customerId)
  }

  const submitRating = async () => {
    if (!rateTarget || !customerId) return
    setBusy(true)
    const { error: insertError } = await supabase.from('feedback').insert({
      booking_id: rateTarget.booking.id,
      instructor_id: rateTarget.pkg.instructor_id,
      customer_id: customerId,
      rating: stars,
      comment: comment.trim() || null,
    })
    setBusy(false)
    if (insertError) {
      setError(insertError.message.includes('duplicate') ? 'You already rated this lesson.' : insertError.message)
      setRateTarget(null)
      return
    }
    setRatings((r) => ({ ...r, [rateTarget.booking.id]: stars }))
    setRateTarget(null)
    setNotice('Thanks! Your feedback helps other students and your instructor.')
  }

  if (gate.status !== 'ready' || loading) return <PageLoading />

  const name = (pkg?: Package) => (pkg ? instructorNames[pkg.instructor_id] ?? 'Instructor' : 'Instructor')
  const item = (i: number) => ({
    initial: m.enabled ? { opacity: 0, y: 12 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { delay: m.duration(Math.min(i, 8) * 0.05), duration: m.duration(0.35) },
  })

  return (
    <Page title="My lessons" subtitle="Upcoming classes, packages and lessons you've taken." width="md"
      actions={<Button href="/customer" icon={CalendarPlus}>Book a lesson</Button>}>
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        items={[
          { id: 'upcoming', label: 'Upcoming', icon: CalendarClock, count: upcoming.length },
          { id: 'packages', label: 'Packages', icon: PackageIcon, count: packages.length },
          { id: 'past', label: 'Past', icon: History, count: past.length },
        ]}
      />
      <Alert>{error}</Alert>
      <Alert tone="success">{notice}</Alert>

      {tab === 'upcoming' &&
        (upcoming.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No upcoming lessons">Book a slot with an instructor to get started.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((b, i) => {
              const pkg = packageById[b.package_id]
              return (
                <motion.li key={b.id} {...item(i)}>
                  <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-fg">{formatSlot(b.slot_start)}</p>
                      <p className="text-sm text-muted">with {name(pkg)} · {pkg?.package_type === 'ten_pack' ? '10-class package' : 'Single class'}</p>
                    </div>
                    <Button variant="danger" size="sm" icon={XCircle} onClick={() => setPending({ kind: 'booking', booking: b, pkg })}>
                      Cancel class
                    </Button>
                  </Card>
                </motion.li>
              )
            })}
          </ul>
        ))}

      {tab === 'packages' &&
        (packages.length === 0 ? (
          <EmptyState icon={PackageIcon} title="No packages yet" />
        ) : (
          <ul className="space-y-3">
            {packages.map((pkg, i) => (
              <motion.li key={pkg.id} {...item(i)}>
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display font-bold text-fg">{name(pkg)}</span>
                    <Badge status={pkg.status} />
                  </div>
                  <p className="text-sm text-muted mt-1">
                    {pkg.package_type === 'single' ? 'Single class' : '10-class package'} · ₹{pkg.price_per_class} per class
                  </p>
                  {pkg.package_type === 'ten_pack' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted mb-1.5">
                        <span>Progress</span>
                        <span>{pkg.classes_completed}/{pkg.classes_total} classes</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-accent rounded-full"
                          initial={m.enabled ? { width: 0 } : false}
                          animate={{ width: `${(pkg.classes_completed / pkg.classes_total) * 100}%` }}
                          transition={{ duration: m.duration(0.9), ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}
                  {pkg.package_type === 'ten_pack' && pkg.status === 'active' && (
                    <Button variant="danger" size="sm" className="mt-4" onClick={() => setPending({ kind: 'package', pkg })}>
                      Cancel entire package
                    </Button>
                  )}
                </Card>
              </motion.li>
            ))}
          </ul>
        ))}

      {tab === 'past' &&
        (past.length === 0 ? (
          <EmptyState icon={History} title="No past lessons yet" />
        ) : (
          <ul className="space-y-3">
            {past.map((b, i) => {
              const pkg = packageById[b.package_id]
              const rated = ratings[b.id]
              return (
                <motion.li key={b.id} {...item(i)}>
                  <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-fg">{formatSlot(b.slot_start)}</p>
                      <p className="text-sm text-muted flex items-center gap-2 mt-0.5">
                        with {name(pkg)} <Badge status={b.status === 'completed' ? 'completed' : 'pending'}>{b.status === 'completed' ? 'completed' : 'awaiting instructor'}</Badge>
                      </p>
                    </div>
                    {rated ? (
                      <span className="flex items-center gap-2 text-sm text-muted">You rated <Stars value={rated} /></span>
                    ) : b.status === 'completed' && pkg ? (
                      <Button size="sm" variant="secondary" icon={Star} onClick={() => { setStars(5); setComment(''); setRateTarget({ booking: b, pkg }) }}>
                        Rate this lesson
                      </Button>
                    ) : null}
                  </Card>
                </motion.li>
              )
            })}
          </ul>
        ))}

      <ConfirmDialog
        open={pending?.kind === 'booking'}
        title="Cancel this class?"
        message={pending?.kind === 'booking' ? `${formatSlot(pending.booking.slot_start)} with ${name(pending.pkg)}. The slot will be released for others.` : ''}
        confirmLabel="Cancel class"
        danger
        loading={busy}
        onClose={() => setPending(null)}
        onConfirm={() => pending?.kind === 'booking' && handleCancelBooking(pending.booking, pending.pkg)}
      />
      <ConfirmDialog
        open={pending?.kind === 'package'}
        title="Cancel the whole package?"
        message={
          pending?.kind === 'package'
            ? pending.pkg.classes_completed > 0
              ? `You'll owe for the ${pending.pkg.classes_completed} class(es) already completed (₹${pending.pkg.classes_completed * pending.pkg.price_per_class}). Upcoming classes will be cancelled.`
              : 'No classes have been completed yet, so nothing will be owed.'
            : ''
        }
        confirmLabel="Cancel package"
        danger
        loading={busy}
        onClose={() => setPending(null)}
        onConfirm={() => pending?.kind === 'package' && handleCancelPackage(pending.pkg)}
      />

      <Dialog open={!!rateTarget} onClose={() => !busy && setRateTarget(null)} title="Rate your lesson">
        {rateTarget && (
          <div className="space-y-5">
            <p className="text-sm text-muted">
              {formatSlot(rateTarget.booking.slot_start)} with {name(rateTarget.pkg)}. Your instructor sees your rating and comment
              anonymously.
            </p>
            <div className="flex justify-center"><StarInput value={stars} onChange={setStars} /></div>
            <Textarea label="Comment (optional)" maxLength={1000} placeholder="What went well? What could be better?" value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRateTarget(null)}>Cancel</Button>
              <Button loading={busy} onClick={submitRating}>Submit feedback</Button>
            </div>
          </div>
        )}
      </Dialog>
    </Page>
  )
}
