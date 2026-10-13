'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CarFront, KeyRound, Save } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuthGate } from '@/lib/useAuthGate'
import InstructorAvatar from '../components/InstructorAvatar'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Field, Input, Textarea } from '../components/ui/Field'
import { Alert } from '../components/ui/Feedback'
import { Page, PageLoading } from '../components/ui/Page'

export default function ProfilePage() {
  const gate = useAuthGate()
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [gender, setGender] = useState('')
  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const userId = gate.status === 'ready' ? gate.userId : null
  const role = gate.status === 'ready' ? gate.role : null
  const email = gate.status === 'ready' ? gate.session.user.email ?? '' : ''

  useEffect(() => {
    if (!userId) return
    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone_number, gender, role')
        .eq('id', userId)
        .single()

      if (profile) {
        setFullName(profile.full_name ?? '')
        setPhoneNumber(profile.phone_number ?? '')
        setGender(profile.gender ?? '')

        if (profile.role === 'instructor') {
          const { data: instructor } = await supabase
            .from('instructors')
            .select('id, bio, photo_url')
            .eq('profile_id', userId)
            .single()

          if (instructor) {
            setInstructorId(instructor.id)
            setBio(instructor.bio ?? '')
            setPhotoUrl(instructor.photo_url ?? '')
          }
        }
      }

      setLoading(false)
    }

    loadProfile()
  }, [userId])

  const handlePhotoChange = async (file: File) => {
    if (!instructorId || !userId) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Please choose an image under 5 MB.')
      return
    }

    setUploadingPhoto(true)
    setError(null)

    const fileExt = file.name.split('.').pop()
    const filePath = `${userId}/photo.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('instructor-photos')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setUploadingPhoto(false)
      setError(uploadError.message)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('instructor-photos').getPublicUrl(filePath)

    // Cache-bust so a replaced photo shows immediately instead of a stale cached version
    const freshUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('instructors')
      .update({ photo_url: freshUrl })
      .eq('id', instructorId)

    setUploadingPhoto(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setPhotoUrl(freshUrl)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setSaved(false)
    setError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        gender: gender || null,
      })
      .eq('id', userId)

    if (updateError) {
      setSaving(false)
      setError(updateError.message)
      return
    }

    if (role === 'instructor' && instructorId) {
      const { error: instructorError } = await supabase
        .from('instructors')
        .update({ bio })
        .eq('id', instructorId)

      if (instructorError) {
        setSaving(false)
        setError(instructorError.message)
        return
      }
    }

    setSaving(false)
    setSaved(true)
  }

  if (gate.status !== 'ready' || loading) return <PageLoading />

  return (
    <Page title="Your profile" subtitle={email} width="sm">
      <form onSubmit={handleSave} className="space-y-5">
        <Card className="space-y-4">
          <Input label="Display name" autoComplete="name" value={fullName} onChange={(e) => { setFullName(e.target.value); setSaved(false) }} required />
          <Input label="Phone number" type="tel" autoComplete="tel" value={phoneNumber} onChange={(e) => { setPhoneNumber(e.target.value); setSaved(false) }} />
          <Field label="Gender">
            {(p) => (
              <select {...p} value={gender} onChange={(e) => { setGender(e.target.value); setSaved(false) }}>
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="transgender">Transgender</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            )}
          </Field>
        </Card>

        {role === 'instructor' && (
          <Card className="space-y-4">
            <h2 className="font-display font-bold text-fg">Instructor details</h2>
            <div className="flex items-center gap-4">
              <InstructorAvatar name={fullName || 'Instructor'} url={photoUrl || null} size="lg" />
              <div>
                <input ref={fileInput} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f); e.target.value = '' }} />
                <Button variant="secondary" icon={Camera} loading={uploadingPhoto} onClick={() => fileInput.current?.click()}>
                  {photoUrl ? 'Change photo' : 'Upload photo'}
                </Button>
                <p className="text-xs text-muted mt-1.5">Students see this on your profile card.</p>
              </div>
            </div>
            <Textarea label="Bio" maxLength={600} placeholder="Tell students a bit about your teaching experience…" value={bio} onChange={(e) => { setBio(e.target.value); setSaved(false) }} />
          </Card>
        )}

        <Alert>{error}</Alert>
        <Alert tone="success">{saved ? 'Profile saved.' : null}</Alert>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="submit" loading={saving} icon={Save} className="flex-1">Save changes</Button>
          {role === 'customer' && <Button variant="secondary" href="/customer/vehicle?redirect=/profile" icon={CarFront}>Car details</Button>}
          <Button variant="ghost" href="/forgot-password" icon={KeyRound}>Change password</Button>
        </div>
      </form>
    </Page>
  )
}
