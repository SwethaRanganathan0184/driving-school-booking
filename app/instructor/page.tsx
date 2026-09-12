'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type AvailabilitySlot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function InstructorAvailabilityPage() {
  const router = useRouter()
  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('05:30')
  const [endTime, setEndTime] = useState('07:30')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadInstructor = async () => {
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const userId = sessionData.session.user.id

      const { data: instructor, error: instructorError } = await supabase
        .from('instructors')
        .select('id')
        .eq('profile_id', userId)
        .single()

      if (instructorError || !instructor) {
        setError('This account is not set up as an instructor yet.')
        setLoading(false)
        return
      }

      setInstructorId(instructor.id)
      await loadSlots(instructor.id)
      setLoading(false)
    }

    loadInstructor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadSlots = async (id: string) => {
    const { data, error: slotsError } = await supabase
      .from('availability')
      .select('*')
      .eq('instructor_id', id)
      .order('day_of_week')
      .order('start_time')

    if (!slotsError && data) {
      setSlots(data)
    }
  }

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!instructorId) return

    if (startTime >= endTime) {
      setError('Start time must be before end time.')
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
    await supabase.from('availability').delete().eq('id', id)
    await loadSlots(instructorId)
  }

  if (loading) return <p className="text-center mt-16 text-[#47526B]">Loading...</p>

  if (error && !instructorId) {
    return <p className="text-center mt-16 text-[#B3261E]">{error}</p>
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F8FA] px-4 py-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] mb-2">
          Your availability
        </h1>
        <p className="text-base text-[#47526B] mb-6">
          Add the weekly time windows you&apos;re available to teach.
        </p>

        <form
          onSubmit={handleAddSlot}
          className="bg-white border border-gray-200 rounded-xl p-4 mb-8 flex flex-wrap items-end gap-4"
        >
          <div>
            <label htmlFor="day" className="block text-sm font-medium text-[#16213E] mb-1">
              Day
            </label>
            <select
              id="day"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F]"
            >
              {DAYS.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="start" className="block text-sm font-medium text-[#16213E] mb-1">
              Start
            </label>
            <input
              id="start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-[#16213E] bg-white focus:outline-none focus:ring-2 focus:ring-[#B8912F] [color-scheme:light]"
            />
          </div>
          <div>
            <label htmlFor="end" className="block text-sm font-medium text-[#16213E] mb-1">
              End
            </label>
            <input
              id="end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-[#16213E] bg-white focus:outline-none focus:ring-2 focus:ring-[#B8912F] [color-scheme:light]"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#B8912F] text-[#16213E] text-sm font-medium px-4 py-2 hover:bg-[#A57F27] transition-colors disabled:opacity-60"
          >
            {saving ? 'Adding...' : 'Add'}
          </button>
        </form>

        {error && <p className="text-sm text-[#B3261E] mb-4">{error}</p>}

        <h2 className="font-semibold text-[#16213E] font-[family-name:var(--font-manrope)] mb-3">
          Current windows
        </h2>
        {slots.length === 0 && <p className="text-base text-[#47526B]">No availability set yet.</p>}
        <ul className="space-y-2">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="bg-white border border-gray-200 rounded-md px-4 py-3 flex items-center justify-between"
            >
              <span className="text-base text-[#16213E]">
                {DAYS[slot.day_of_week]}: {slot.start_time} – {slot.end_time}
              </span>
              <button
                type="button"
                onClick={() => handleDeleteSlot(slot.id)}
                className="text-sm text-[#B3261E] hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}