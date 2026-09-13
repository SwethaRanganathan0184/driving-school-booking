'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const PRICE_PER_CLASS = 400

type AvailabilityWindow = {
  day_of_week: number
  start_time: string
  end_time: string
}

type CandidateSlot = {
  start: Date
  end: Date
}

export default function BookInstructorPage() {
  const params = useParams<{ instructorId: string }>()
  const router = useRouter()
  const instructorId = params.instructorId

  const [customerId, setCustomerId] = useState<string | null>(null)
  const [instructorName, setInstructorName] = useState('')
  const [packageType, setPackageType] = useState<'single' | 'ten_pack'>('single')
  const [candidateSlots, setCandidateSlots] = useState<CandidateSlot[]>([])
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingKey, setBookingKey] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

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
        const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }
      setCustomerId(sessionData.session.user.id)

      const { data: vehicle } = await supabase
        .from('customer_vehicles')
        .select('id')
        .eq('customer_id', sessionData.session.user.id)
        .maybeSingle()

      if (!vehicle) {
        router.push(`/customer/vehicle?redirect=/customer/instructor/${instructorId}`)
        return
      }

      const { data: instructor } = await supabase
        .from('instructors')
        .select('profiles(full_name)')
        .eq('id', instructorId)
        .single()

      const profiles = instructor?.profiles as unknown as { full_name: string | null } | null
      setInstructorName(profiles?.full_name ?? 'Instructor')

      await loadSlots()
      setLoading(false)
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  useEffect(() => {
    if (!selectedDateKey && days.some((d) => d.hasSlots)) {
      setSelectedDateKey(days.find((d) => d.hasSlots)!.key)
    }
  }, [days, selectedDateKey])

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

  const handleBook = async (slot: CandidateSlot) => {
    const confirmed = window.confirm(
      `Book this class on ${slot.start.toLocaleDateString()} at ${slot.start.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}?`
    )
    if (!confirmed) return

    setBookingKey(slot.start.getTime())
    setError(null)
    setMessage(null)

    const packageId = await getOrCreatePackageId()
    if (!packageId) {
      setBookingKey(null)
      return
    }
        const { error: bookingError } = await supabase.from('bookings').insert({
      package_id: packageId,
      instructor_id: instructorId,
      slot_start: slot.start.toISOString(),
      slot_end: slot.end.toISOString(),
    })

    if (bookingError) {
      // Roll back a freshly-created single-class package so it doesn't linger as an orphan
      if (packageType === 'single') {
        await supabase.from('packages').delete().eq('id', packageId)
      }
      setBookingKey(null)
      setError(
        bookingError.message.includes('duplicate')
          ? 'That slot was just booked by someone else. Please pick another.'
          : bookingError.message
      )
      return
    }

    setMessage('Class booked!')
    await loadSlots()
  }

  if (loading) return <p className="text-center mt-16 text-[#47526B]">Loading...</p>

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F8FA] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-6">
          Book with {instructorName}
        </h1>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setPackageType('single')}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              packageType === 'single'
                ? 'border-[#16213E] bg-white'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-semibold text-[#16213E]">Single class</div>
            <div className="text-xs text-[#47526B] mt-1">₹{PRICE_PER_CLASS} · pay after class</div>
          </button>
          <button
            type="button"
            onClick={() => setPackageType('ten_pack')}
            className={`rounded-lg border-2 p-4 text-left transition-colors ${
              packageType === 'ten_pack'
                ? 'border-[#16213E] bg-white'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-sm font-semibold text-[#16213E]">10-class package</div>
            <div className="text-xs text-[#47526B] mt-1">
              ₹{PRICE_PER_CLASS * 10} · pay after all 10
            </div>
          </button>
        </div>

        {error && <p className="text-sm text-[#B3261E] mb-4">{error}</p>}
        {message && <p className="text-sm text-green-700 mb-4">{message}</p>}

        <h2 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] mb-3">
          Pick a date
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
          {days.map((day) => {
            const isSelected = selectedDateKey === day.key
            return (
              <button
                key={day.key}
                type="button"
                disabled={!day.hasSlots}
                onClick={() => setSelectedDateKey(day.key)}
                className={`shrink-0 w-16 rounded-lg border-2 py-2 flex flex-col items-center transition-colors ${
                  isSelected
                    ? 'border-[#16213E] bg-[#16213E]'
                    : day.hasSlots
                    ? 'border-gray-200 bg-white hover:border-gray-300'
                    : 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                }`}
              >
                <span
                  className={`text-[10px] uppercase tracking-wide ${
                    isSelected ? 'text-white/60' : 'text-[#47526B]'
                  }`}
                >
                  {day.date.toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
                <span
                  className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-[#16213E]'}`}
                >
                  {day.date.getDate()}
                </span>
                {day.hasSlots && (
                  <span
                    className={`mt-1 w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-[#B8912F]' : 'bg-[#16213E]'
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>

        <h2 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] mb-3">
          Pick a time
        </h2>
        {slotsForSelectedDay.length === 0 && (
          <p className="text-base text-[#47526B]">No open times on this day.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {slotsForSelectedDay.map((slot) => (
            <button
              key={slot.start.getTime()}
              type="button"
              disabled={bookingKey === slot.start.getTime()}
              onClick={() => handleBook(slot)}
              className="rounded-lg border border-gray-200 bg-white py-3 text-sm font-medium text-[#16213E] hover:border-[#16213E] transition-colors disabled:opacity-60"
            >
              {bookingKey === slot.start.getTime()
                ? 'Booking...'
                : slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          ))}
        </div>
      </div>
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