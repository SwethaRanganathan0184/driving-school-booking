'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CarFront } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { safeRedirect, useAuthGate } from '@/lib/useAuthGate'
import AuthCard from '../../components/AuthCard'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { Alert } from '../../components/ui/Feedback'
import { PageLoading } from '../../components/ui/Page'

function VehicleDetailsForm() {
  const router = useRouter()
  const gate = useAuthGate()
  const redirectTo = safeRedirect(useSearchParams().get('redirect'), '/customer')

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [transmission, setTransmission] = useState<'manual' | 'automatic' | ''>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (gate.status !== 'ready') return
    supabase
      .from('customer_vehicles')
      .select('make, model, year, transmission')
      .eq('customer_id', gate.userId)
      .maybeSingle()
      .then(({ data: vehicle }) => {
        if (vehicle) {
          setMake(vehicle.make)
          setModel(vehicle.model)
          setYear(String(vehicle.year))
          setTransmission(vehicle.transmission)
        }
        setLoading(false)
      })
  }, [gate])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (gate.status !== 'ready') return
    setError(null)

    if (!transmission) {
      setError('Please select the transmission type.')
      return
    }

    setSaving(true)

    const { error: saveError } = await supabase.from('customer_vehicles').upsert(
      {
        customer_id: gate.userId,
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

  if (gate.status !== 'ready' || loading) return <PageLoading />

  return (
    <AuthCard title="Your car details" subtitle="Lessons happen in your own car, so we need a few details before you book.">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Make" placeholder="e.g. Maruti Suzuki" value={make} onChange={(e) => setMake(e.target.value)} required />
          <Input label="Model" placeholder="e.g. Swift" value={model} onChange={(e) => setModel(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Year" type="number" min={1980} max={new Date().getFullYear() + 1} placeholder="e.g. 2019" value={year} onChange={(e) => setYear(e.target.value)} required />
          <Field label="Transmission">
            {(p) => (
              <select {...p} value={transmission} onChange={(e) => setTransmission(e.target.value as 'manual' | 'automatic')} required>
                <option value="" disabled>Select…</option>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            )}
          </Field>
        </div>
        <Alert>{error}</Alert>
        <Button type="submit" size="lg" loading={saving} icon={CarFront} className="w-full">
          Save and continue
        </Button>
      </form>
    </AuthCard>
  )
}

export default function VehicleDetailsPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <VehicleDetailsForm />
    </Suspense>
  )
}
