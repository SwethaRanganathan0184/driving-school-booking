'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Briefcase, CalendarCheck, CalendarX, CheckCircle2, Clock, Languages, MapPin, Package as PackageIcon, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuthGate } from '@/lib/useAuthGate'
import { fetchInstructors, type InstructorCard } from '@/lib/instructors'
import { useMotionProfile } from '@/lib/motion'
import { useSiteTheme } from '../../../components/ThemeProvider'
import InstructorAvatar from '../../../components/InstructorAvatar'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { Dialog } from '../../../components/ui/Dialog'
import { Alert, Stars } from '../../../components/ui/Feedback'
import { EmptyState, Page, PageLoading, PageMessage } from '../../../components/ui/Page'

type AvailabilityWindow = {
  day_of_week: number
  start_time: string
  end_time: string
}

type CandidateSlot = {
  start: Date
  end: Date
}

type Review = { id: string; rating: number; comment: string; created_at: string }

export default function BookInstructorPage() {
  const params = useParams<{ instructorId: string }>()
  const router = useRouter()
  const gate = useAuthGate()
  const m = useMotionProfile()
  const { settings } = useSiteTheme()
  const PRICE_PER_CLASS = settings.pricePerClass
  const instructorId = params.instructorId

  const [instructor, setInstructor] = useState<InstructorCard | null | undefined>(undefined)
  const [reviews, setReviews] = useState<Review[]>([])
  const [packageType, setPackageType] = useState<'single' | 'ten_pack'>('single')
  const [candidateSlots, setCandidateSlots] = useState<CandidateSlot[]>([])
  const [pickedDateKey, setPickedDateKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingSlot, setPendingSlot] = useState<CandidateSlot | null>(null)
  const [booking, setBooking] = useState(false)
  const [bookedSlot, setBookedSlot] = useState<CandidateSlot | null>(null)
  const [error, setError] = useState<string | null>(null)

  const customerId = gate.status === 'ready' ? gate.userId : null

  const loadSlots = useCallback(async () => {
    const { data: availability } = await supabase
      .from('availability')
      .select('day_of_week, start_time, end_time')
      .eq('instructor_id', instructorId)

    const { data: bookings } = await supabase
      .from('bookings')
      .select('slot_start')
      .eq('instructor_id', instructorId)
      .in('status', ['confirmed', 'completed'])

    const bookedTimes = new Set((bookings ?? []).map((b) => new Date(b.slot_start).getTime()))

    setCandidateSlots(generateCandidateSlots((availability ?? []) as AvailabilityWindow[], bookedTimes))
  }, [instructorId])

  useEffect(() => {
    if (gate.status !== 'ready') return
    const init = async () => {
      const { data: vehicle } = await supabase
        .from('customer_vehicles')
        .select('id')
        .eq('customer_id', gate.userId)
        .maybeSingle()

      if (!vehicle) {
        router.push(`/customer/vehicle?redirect=/customer/instructor/${instructorId}`)
        return
      }

      const [found] = await fetchInstructors({ id: instructorId, includeInactive: true })
      setInstructor(found ?? null)

      const { data: reviewRows } = await supabase
        .from('public_reviews')
        .select('id, rating, comment, created_at')
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false })
        .limit(6)
      setReviews((reviewRows ?? []) as Review[])

      await loadSlots()
      setLoading(false)
    }

    init()
  }, [gate, instructorId, loadSlots, router])

  const days = useMemo(() => {
    const result: { key: string; date: Date; hasSlots: boolean }[] = []
    for (let i = 0; i < 14; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      d.setHours(0, 0, 0, 0)
      const key = d.toDateString()
      const hasSlots = candidateSlots.some((s) => s.start.toDateString() === key)
      result.push({ key, date: d, hasSlots })
    }
    return result
  }, [candidateSlots])

  // Default to the first day with open slots until the customer picks one.
  const selectedDateKey = pickedDateKey ?? days.find((d) => d.hasSlots)?.key ?? null

  const slotsForSelectedDay = useMemo(() => {
    if (!selectedDateKey) return []
    return candidateSlots
      .filter((s) => s.start.toDateString() === selectedDateKey)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [candidateSlots, selectedDateKey])

  const getOrCreatePackageId = async (): Promise<string | null> => {
    if (!customerId) return null

    if (packageType === 'single') {
      const { data: newPackage, error: insertError } = await supabase
        .from('packages')
        .insert({
          customer_id: customerId,
          instructor_id: instructorId,
          package_type: 'single',
          classes_total: 1,
          price_per_class: PRICE_PER_CLASS,
        })
        .select()
        .single()

      if (insertError || !newPackage) {
        setError(insertError?.message ?? 'Could not start booking.')
        return null
      }
      return newPackage.id
    }

    const { data: existing } = await supabase
      .from('packages')
      .select('id, classes_total')
      .eq('customer_id', customerId)
      .eq('instructor_id', instructorId)
      .eq('package_type', 'ten_pack')
      .eq('status', 'active')
      .maybeSingle()

    if (existing) {
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('package_id', existing.id)
        .neq('status', 'cancelled')

      if ((count ?? 0) < existing.classes_total) {
        return existing.id
      }
    }

    const { data: newPackage, error: insertError } = await supabase
      .from('packages')
      .insert({
        customer_id: customerId,
        instructor_id: instructorId,
        package_type: 'ten_pack',
        classes_total: 10,
        price_per_class: PRICE_PER_CLASS,
      })
      .select()
      .single()

    if (insertError || !newPackage) {
      setError(insertError?.message ?? 'Could not start booking.')
      return null
    }
    return newPackage.id
  }

  const handleBook = async () => {
    const slot = pendingSlot
    if (!slot) return
    setBooking(true)
    setError(null)

    const packageId = await getOrCreatePackageId()
    if (!packageId) {
      setBooking(false)
      setPendingSlot(null)
      return
    }

    const { error: bookingError } = await supabase.from('bookings').insert({
      package_id: packageId,
      instructor_id: instructorId,
      slot_start: slot.start.toISOString(),
      slot_end: slot.end.toISOString(),
    })

    setBooking(false)
    setPendingSlot(null)

    if (bookingError) {
      // Roll back a freshly-created single-class package so it doesn't linger as an orphan
      if (packageType === 'single') {
        await supabase.from('packages').delete().eq('id', packageId)
      }
      setError(
        bookingError.message.includes('duplicate')
          ? 'That slot was just booked by someone else. Please pick another.'
          : bookingError.message
      )
      await loadSlots()
      return
    }

    setBookedSlot(slot)
    await loadSlots()
  }

  if (gate.status === 'denied') return <PageMessage title="No access">{gate.message}</PageMessage>
  if (gate.status !== 'ready' || loading || instructor === undefined) return <PageLoading />
  if (!instructor || !instructor.active) {
    return (
      <PageMessage title="Instructor unavailable">
        This instructor isn&apos;t taking bookings right now.
        <div className="mt-6"><Button href="/customer" icon={ArrowLeft}>Back to instructors</Button></div>
      </PageMessage>
    )
  }

  const time = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const longDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <Page title={`Book with ${instructor.full_name}`} subtitle="Choose a package, then pick a day and time." width="lg"
      actions={<Button variant="ghost" href="/customer" icon={ArrowLeft}>All instructors</Button>}>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <section aria-labelledby="pkg">
            <h2 id="pkg" className="text-xs uppercase tracking-widest text-muted mb-3">1 · Package</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'single', title: 'Single class', price: PRICE_PER_CLASS, note: 'pay after class', icon: Sparkles },
                { id: 'ten_pack', title: '10-class package', price: PRICE_PER_CLASS * 10, note: 'pay after all 10', icon: PackageIcon },
              ] as const).map((p) => {
                const active = packageType === p.id
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    onClick={() => setPackageType(p.id)}
                    aria-pressed={active}
                    whileTap={m.hover ? { scale: m.pressScale } : undefined}
                    className={`text-left rounded-[var(--radius)] border-2 p-4 transition-colors cursor-pointer ${
                      active ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/40'
                    }`}
                  >
                    <p.icon className={`size-5 mb-2 ${active ? 'text-accent' : 'text-muted'}`} aria-hidden />
                    <div className="font-semibold text-fg">{p.title}</div>
                    <div className="text-sm text-muted mt-0.5">₹{p.price.toLocaleString('en-IN')} · {p.note}</div>
                  </motion.button>
                )
              })}
            </div>
          </section>

          <Alert>{error}</Alert>

          <section aria-labelledby="date">
            <h2 id="date" className="text-xs uppercase tracking-widest text-muted mb-3">2 · Date</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {days.map((day) => {
                const isSelected = selectedDateKey === day.key
                return (
                  <button
                    key={day.key}
                    type="button"
                    disabled={!day.hasSlots}
                    onClick={() => setPickedDateKey(day.key)}
                    aria-pressed={isSelected}
                    className={`relative shrink-0 w-16 rounded-[var(--radius)] border py-2.5 flex flex-col items-center transition-colors cursor-pointer disabled:cursor-not-allowed ${
                      isSelected
                        ? 'border-accent text-accent-fg'
                        : day.hasSlots
                        ? 'border-border bg-surface text-fg hover:border-accent/50'
                        : 'border-border/50 bg-surface/40 text-muted opacity-40'
                    }`}
                  >
                    {isSelected && (
                      <motion.span layoutId="day-pill" className="absolute inset-0 bg-accent rounded-[calc(var(--radius)-1px)]" transition={m.enabled ? m.spring : { duration: 0 }} />
                    )}
                    <span className={`relative text-[10px] uppercase tracking-wide ${isSelected ? '' : 'text-muted'}`}>
                      {day.date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className="relative text-lg font-bold">{day.date.getDate()}</span>
                    {day.hasSlots && !isSelected && <span className="relative mt-0.5 size-1.5 rounded-full bg-accent" />}
                  </button>
                )
              })}
            </div>
          </section>

          <section aria-labelledby="time">
            <h2 id="time" className="text-xs uppercase tracking-widest text-muted mb-3">3 · Time</h2>
            {slotsForSelectedDay.length === 0 ? (
              <EmptyState icon={CalendarX} title="No open times">
                {days.some((d) => d.hasSlots) ? 'Pick another day.' : 'This instructor has no open slots in the next two weeks.'}
              </EmptyState>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div key={selectedDateKey} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {slotsForSelectedDay.map((slot, i) => (
                    <motion.button
                      key={slot.start.getTime()}
                      type="button"
                      onClick={() => setPendingSlot(slot)}
                      initial={m.enabled ? { opacity: 0, scale: 0.92 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: m.duration(i * 0.03), duration: m.duration(0.25) }}
                      whileHover={m.hover ? { y: -2 } : undefined}
                      className="flex items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-surface py-3 text-sm font-medium text-fg hover:border-accent hover:text-accent transition-colors cursor-pointer"
                    >
                      <Clock className="size-4" aria-hidden />
                      {time(slot.start)}
                    </motion.button>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card>
            <div className="flex items-center gap-4">
              <InstructorAvatar name={instructor.full_name} url={instructor.photo_url} />
              <div>
                <h2 className="font-display font-bold text-fg">{instructor.full_name}</h2>
                {instructor.rating !== null ? (
                  <div className="flex items-center gap-1.5 text-sm mt-0.5">
                    <Stars value={instructor.rating} /> <span className="text-muted">{instructor.rating.toFixed(1)} ({instructor.review_count})</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted mt-0.5">No reviews yet</p>
                )}
              </div>
            </div>
            {instructor.bio && <p className="text-sm text-muted mt-4">{instructor.bio}</p>}
            <ul className="mt-4 space-y-1.5 text-sm text-fg/80">
              {instructor.experience_years !== null && <li className="flex items-center gap-2"><Briefcase className="size-4 text-accent" aria-hidden />{instructor.experience_years} yrs experience</li>}
              {instructor.service_area && <li className="flex items-center gap-2"><MapPin className="size-4 text-accent" aria-hidden />{instructor.service_area}</li>}
              {instructor.languages.length > 0 && <li className="flex items-center gap-2"><Languages className="size-4 text-accent" aria-hidden />{instructor.languages.join(', ')}</li>}
            </ul>
          </Card>
          {reviews.length > 0 && (
            <Card>
              <h2 className="font-display font-bold text-fg mb-3">Student reviews</h2>
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="text-sm">
                    <Stars value={r.rating} />
                    <p className="text-fg/90 mt-1">&ldquo;{r.comment}&rdquo;</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>

      <Dialog open={!!pendingSlot} onClose={() => !booking && setPendingSlot(null)} title="Confirm your lesson">
        {pendingSlot && (
          <>
            <dl className="rounded-[var(--radius)] bg-surface-2 border border-border p-4 space-y-2 text-sm mb-6">
              <Row label="Instructor" value={instructor.full_name} />
              <Row label="Date" value={longDate(pendingSlot.start)} />
              <Row label="Time" value={`${time(pendingSlot.start)} – ${time(pendingSlot.end)}`} />
              <Row label="Package" value={packageType === 'single' ? 'Single class' : '10-class package'} />
              <Row label="Price" value={`₹${PRICE_PER_CLASS.toLocaleString('en-IN')} per class, paid after`} />
            </dl>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPendingSlot(null)} disabled={booking}>Cancel</Button>
              <Button icon={CalendarCheck} loading={booking} onClick={handleBook}>Confirm booking</Button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog open={!!bookedSlot} onClose={() => setBookedSlot(null)} title="You're booked!">
        {bookedSlot && (
          <div className="text-center">
            <motion.div
              initial={m.enabled ? { scale: 0, rotate: -45 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            >
              <CheckCircle2 className="size-14 text-success mx-auto" aria-hidden />
            </motion.div>
            <p className="text-fg font-medium mt-4">{longDate(bookedSlot.start)} at {time(bookedSlot.start)}</p>
            <p className="text-sm text-muted mt-1">with {instructor.full_name}. Pay after the class.</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
              <Button variant="secondary" onClick={() => setBookedSlot(null)}>Book another</Button>
              <Button href="/customer/packages">View my lessons</Button>
            </div>
          </div>
        )}
      </Dialog>
    </Page>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-fg font-medium text-right">{value}</dd>
    </div>
  )
}

function generateCandidateSlots(
  availability: AvailabilityWindow[],
  bookedTimes: Set<number>
): CandidateSlot[] {
  const slots: CandidateSlot[] = []
  const now = new Date()

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)
    const dayOfWeek = date.getDay()

    const windows = availability.filter((w) => w.day_of_week === dayOfWeek)

    for (const window of windows) {
      const [startH, startM] = window.start_time.split(':').map(Number)
      const [endH, endM] = window.end_time.split(':').map(Number)

      let slotStart = new Date(date)
      slotStart.setHours(startH, startM, 0, 0)
      const windowEnd = new Date(date)
      windowEnd.setHours(endH, endM, 0, 0)

      while (true) {
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000)
        if (slotEnd > windowEnd) break

        if (slotStart > now && !bookedTimes.has(slotStart.getTime())) {
          slots.push({ start: new Date(slotStart), end: new Date(slotEnd) })
        }
        slotStart = slotEnd
      }
    }
  }

  return slots
}
