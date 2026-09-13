'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoMark from '../../components/LogoMark'

function VehicleDetailsForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/customer'

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [transmission, setTransmission] = useState<'manual' | 'automatic' | ''>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const { data: vehicle } = await supabase
        .from('customer_vehicles')
        .select('make, model, year, transmission')
        .eq('customer_id', sessionData.session.user.id)
        .maybeSingle()

      if (vehicle) {
        setMake(vehicle.make)
        setModel(vehicle.model)
        setYear(String(vehicle.year))
        setTransmission(vehicle.transmission)
      }

      setLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!transmission) {
      setError('Please select the transmission type.')
      return
    }

    setSaving(true)

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      router.push('/login')
      return
    }

    const { error: saveError } = await supabase.from('customer_vehicles').upsert(
      {
        customer_id: sessionData.session.user.id,
        make,
        model,
        year: Number(year),
        transmission,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'customer_id' }
    )

    setSaving(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    router.push(redirectTo)
  }

  if (loading) return <p className="text-center mt-16 text-[#47526B]">Loading...</p>

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#F7F8FA] px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="flex justify-center mb-5">
          <LogoMark className="w-10 h-10 text-[#16213E]" />
        </div>
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] text-center">
          Your car details
        </h1>
        <p className="text-sm text-[#47526B] text-center mt-1 mb-8">
          Since lessons happen in your own car, we need a few details before you can book.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-[#16213E] mb-1">
              Make
            </label>
            <input
              id="make"
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              required
              placeholder="e.g. Maruti Suzuki"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E]"
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-[#16213E] mb-1">
              Model
            </label>
            <input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              placeholder="e.g. Swift"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E]"
            />
          </div>
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-[#16213E] mb-1">
              Year
            </label>
            <input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              min={1980}
              max={new Date().getFullYear() + 1}
              placeholder="e.g. 2019"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E]"
            />
          </div>
          <div>
            <label htmlFor="transmission" className="block text-sm font-medium text-[#16213E] mb-1">
              Transmission
            </label>
            <select
              id="transmission"
              value={transmission}
              onChange={(e) => setTransmission(e.target.value as 'manual' | 'automatic')}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E] bg-white"
            >
              <option value="" disabled>
                Select...
              </option>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>

          {error && <p className="text-sm text-[#B3261E]">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-[#B8912F] text-[#16213E] font-medium py-2.5 hover:bg-[#A57F27] transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function VehicleDetailsPage() {
  return (
    <Suspense fallback={<p className="text-center mt-16 text-[#47526B]">Loading...</p>}>
      <VehicleDetailsForm />
    </Suspense>
  )
}