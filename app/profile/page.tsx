'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoMark from '../components/LogoMark'

export default function ProfilePage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [gender, setGender] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const userId = sessionData.session.user.id
      setEmail(sessionData.session.user.email ?? '')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, phone_number, gender, role')
        .eq('id', userId)
        .single()

      if (!profileError && profile) {
        setFullName(profile.full_name ?? '')
        setPhoneNumber(profile.phone_number ?? '')
        setGender(profile.gender ?? '')
        setRole(profile.role)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !instructorId) return

    setUploadingPhoto(true)
    setError(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    if (!userId) {
      setUploadingPhoto(false)
      return
    }

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

    const { data: publicUrlData } = supabase.storage
      .from('instructor-photos')
      .getPublicUrl(filePath)

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
    setSaving(true)
    setSaved(false)
    setError(null)

    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session) {
      router.push('/login')
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        gender: gender || null,
      })
      .eq('id', sessionData.session.user.id)

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

  if (loading) return <p className="text-center mt-16 text-[#47526B]">Loading...</p>

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#F7F8FA] px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="flex justify-center mb-5">
          <LogoMark className="w-10 h-10 text-[#16213E]" />
        </div>
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] text-center mb-8">
          Your profile
        </h1>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#16213E] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#47526B] bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-[#16213E] mb-1">
              Display name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E]"
            />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-[#16213E] mb-1">
              Phone number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E]"
            />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-[#16213E] mb-1">
              Gender
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E] bg-white"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="transgender">Transgender</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          {role === 'instructor' && (
            <>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm font-semibold text-[#16213E] mb-3">Instructor details</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#16213E] mb-2">Photo</label>
                <div className="flex items-center gap-4">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Your profile"
                      className="w-16 h-16 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-[#47526B]">
                      No photo
                    </div>
                  )}
                  <label className="cursor-pointer text-sm text-[#16213E] rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50 transition-colors">
                    {uploadingPhoto ? 'Uploading...' : photoUrl ? 'Change photo' : 'Upload photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-[#16213E] mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell customers a bit about your teaching experience..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E]"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-[#B3261E]">{error}</p>}
          {saved && <p className="text-sm text-green-700">Saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-[#B8912F] text-[#16213E] font-medium py-2.5 hover:bg-[#A57F27] transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}