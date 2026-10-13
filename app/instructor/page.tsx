'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, Clock, Plus, Star, Trash2, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useInstructor } from '@/lib/useInstructor'
import { useMotionProfile } from '@/lib/motion'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Field } from '../components/ui/Field'
import { Alert } from '../components/ui/Feedback'
import { Page, PageLoading, PageMessage } from '../components/ui/Page'

type AvailabilitySlot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// Show the week Monday-first, like a normal planner.
const WEEK = [1, 2, 3, 4, 5, 6, 0]

const hhmm = (t: string) => t.slice(0, 5)
const hours = (s: AvailabilitySlot) => {
  const [sh, sm] = s.start_time.split(':').map(Number)
  const [eh, em] = s.end_time.split(':').map(Number)
  return Math.floor((eh * 60 + em - (sh * 60 + sm)) / 60)
}

export default function InstructorSchedulePage() {
  const inst = useInstructor()
  const m = useMotionProfile()
  const instructorId = inst.status === 'ready' ? inst.instructorId : null
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [stats, setStats] = useState({ upcoming: 0, rating: null as number | null, reviews: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('05:30')
  const [endTime, setEndTime] = useState('07:30')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const loadSlots = useCallback(async (id: string) => {
    const { data, error: slotsError } = await supabase
      .from('availability')
      .select('*')
      .eq('instructor_id', id)
      .order('day_of_week')
      .order('start_time')

    if (!slotsError && data) setSlots(data)
  }, [])

  useEffect(() => {
    if (!instructorId) return
    const load = async () => {
      await loadSlots(instructorId)
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .eq('status', 'confirmed')
        .gt('slot_start', new Date().toISOString())
      const { data: rating } = await supabase
        .from('instructor_ratings')
        .select('average_rating, review_count')
        .eq('instructor_id', instructorId)
        .maybeSingle()
      setStats({ upcoming: count ?? 0, rating: rating ? Number(rating.average_rating) : null, reviews: rating?.review_count ?? 0 })
      setLoading(false)
    }
    load()
  }, [instructorId, loadSlots])

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!instructorId) return

    if (startTime >= endTime) {
      setError('Start time must be before end time.')
      return
    }
    const overlaps = slots.some(
      (s) => s.day_of_week === dayOfWeek && startTime < hhmm(s.end_time) && endTime > hhmm(s.start_time)
    )
    if (overlaps) {
      setError(`That overlaps an existing ${DAYS[dayOfWeek]} window.`)
      return
    }

    setSaving(true)
    setError(null)

    const { error: insertError } = await supabase.from('availability').insert({
      instructor_id: instructorId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    await loadSlots(instructorId)
  }

  const handleDeleteSlot = async (id: string) => {
    if (!instructorId) return
    setRemoving(id)
    await supabase.from('availability').delete().eq('id', id)
    await loadSlots(instructorId)
    setRemoving(null)
  }

  if (inst.status === 'denied') return <PageMessage title="Instructor area">{inst.message}</PageMessage>
  if (inst.status !== 'ready' || loading) return <PageLoading />

  const weeklyHours = slots.reduce((sum, s) => sum + hours(s), 0)

  return (
    <Page title="Your schedule" subtitle="Set the weekly windows you're available to teach. Students book 1-hour slots inside them." width="lg">
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: Users, label: 'Upcoming lessons', value: stats.upcoming },
          { icon: Clock, label: 'Bookable hours / week', value: weeklyHours },
          { icon: Star, label: stats.reviews ? `Rating (${stats.reviews})` : 'Rating', value: stats.rating?.toFixed(1) ?? '—' },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-4">
            <Icon className="size-4 text-accent mb-2" aria-hidden />
            <p className="font-display text-2xl font-bold text-fg">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <h2 className="font-display font-bold text-fg mb-4 flex items-center gap-2"><Plus className="size-4 text-accent" />Add a window</h2>
        <form onSubmit={handleAddSlot} className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 items-end">
          <div className="col-span-2 sm:col-span-1">
            <Field label="Day">
              {(p) => (
                <select {...p} value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
                  {WEEK.map((d) => <option key={d} value={d}>{DAYS[d]}</option>)}
                </select>
              )}
            </Field>
          </div>
          <Field label="Start">{(p) => <input {...p} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />}</Field>
          <Field label="End">{(p) => <input {...p} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />}</Field>
          <Button type="submit" loading={saving} icon={Plus} className="col-span-2 sm:col-span-1">Add</Button>
        </form>
        <div className="mt-4"><Alert>{error}</Alert></div>
      </Card>

      <h2 className="font-display font-bold text-fg mb-3 flex items-center gap-2"><CalendarClock className="size-4 text-accent" />Weekly availability</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {WEEK.map((d) => {
          const daySlots = slots.filter((s) => s.day_of_week === d)
          return (
            <div key={d} className={`rounded-[var(--radius)] border p-3 min-h-28 ${daySlots.length ? 'border-accent/30 bg-surface' : 'border-border bg-surface/40'}`}>
              <p className="text-xs uppercase tracking-widest text-muted mb-2">{DAYS[d].slice(0, 3)}</p>
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {daySlots.map((s) => (
                    <motion.li
                      key={s.id}
                      layout={m.enabled}
                      initial={m.enabled ? { opacity: 0, scale: 0.9 } : false}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={m.enabled ? { opacity: 0, scale: 0.9 } : undefined}
                      className="group flex items-center justify-between gap-1 rounded-[calc(var(--radius)-4px)] bg-accent/15 text-fg px-2 py-1.5 text-sm"
                    >
                      <span className="tabular-nums">{hhmm(s.start_time)}–{hhmm(s.end_time)}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(s.id)}
                        disabled={removing === s.id}
                        className="text-muted hover:text-danger cursor-pointer disabled:opacity-40"
                        aria-label={`Remove ${DAYS[d]} ${hhmm(s.start_time)} to ${hhmm(s.end_time)}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
                {daySlots.length === 0 && <li className="text-xs text-muted/70">Off</li>}
              </ul>
            </div>
          )
        })}
      </div>
    </Page>
  )
}
