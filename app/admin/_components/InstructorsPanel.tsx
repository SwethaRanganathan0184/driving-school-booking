'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUpCircle, Camera, Check, Copy, Pencil, Power, RefreshCw, UserPlus, Users } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { fetchInstructors, splitList, type InstructorCard } from '@/lib/instructors'
import { useMotionProfile } from '@/lib/motion'
import { createInstructor } from '../../actions/instructors'
import InstructorAvatar from '../../components/InstructorAvatar'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { ConfirmDialog, Dialog } from '../../components/ui/Dialog'
import { Input, Textarea } from '../../components/ui/Field'
import { Alert, Badge, Stars } from '../../components/ui/Feedback'
import { EmptyState, PageLoading } from '../../components/ui/Page'

type Details = {
  fullName: string
  phone: string
  bio: string
  experienceYears: string
  languages: string
  specialties: string
  serviceArea: string
}

const EMPTY: Details = { fullName: '', phone: '', bio: '', experienceYears: '', languages: '', specialties: '', serviceArea: '' }

function tempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

async function fetchPanelData() {
  const instructors = await fetchInstructors({ includeInactive: true })
  const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'customer').order('full_name')
  return { instructors, customers: (data ?? []) as { id: string; full_name: string | null }[] }
}

function DetailsFields({ value, onChange }: { value: Details; onChange: (d: Details) => void }) {
  const set = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [k]: e.target.value })
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Full name" value={value.fullName} onChange={set('fullName')} required />
        <Input label="Phone" type="tel" value={value.phone} onChange={set('phone')} />
      </div>
      <Textarea label="Bio" rows={3} maxLength={600} value={value.bio} onChange={set('bio')} placeholder="Teaching style, certifications, what students can expect…" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Years of experience" type="number" min={0} max={60} value={value.experienceYears} onChange={set('experienceYears')} />
        <Input label="Service area" value={value.serviceArea} onChange={set('serviceArea')} placeholder="e.g. Indiranagar, Koramangala" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Languages" hint="Comma separated" value={value.languages} onChange={set('languages')} placeholder="English, Kannada, Hindi" />
        <Input label="Specialties" hint="Comma separated" value={value.specialties} onChange={set('specialties')} placeholder="Nervous beginners, Highway driving" />
      </div>
    </>
  )
}

export default function InstructorsPanel({ accessToken }: { accessToken: string }) {
  const m = useMotionProfile()
  const [instructors, setInstructors] = useState<InstructorCard[] | null>(null)
  const [customers, setCustomers] = useState<{ id: string; full_name: string | null }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<Details>(EMPTY)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(tempPassword)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [editing, setEditing] = useState<InstructorCard | null>(null)
  const [editForm, setEditForm] = useState<Details>(EMPTY)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const [toggling, setToggling] = useState<InstructorCard | null>(null)
  const [promoteSearch, setPromoteSearch] = useState('')
  const [promoting, setPromoting] = useState<string | null>(null)

  const apply = useCallback((d: Awaited<ReturnType<typeof fetchPanelData>>) => {
    setInstructors(d.instructors)
    setCustomers(d.customers)
  }, [])

  const load = async () => apply(await fetchPanelData())

  useEffect(() => {
    let active = true
    fetchPanelData().then((d) => active && apply(d))
    return () => {
      active = false
    }
  }, [apply])

  const toPayload = (d: Details) => ({
    bio: d.bio.trim(),
    experience_years: d.experienceYears === '' ? null : Number(d.experienceYears),
    languages: splitList(d.languages),
    specialties: splitList(d.specialties),
    service_area: d.serviceArea.trim() || null,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const p = toPayload(form)
    const result = await createInstructor(accessToken, {
      fullName: form.fullName,
      email,
      tempPassword: password,
      phone: form.phone,
      bio: p.bio,
      experienceYears: p.experience_years,
      languages: p.languages,
      specialties: p.specialties,
      serviceArea: form.serviceArea,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setAdding(false)
    setCreated({ name: form.fullName, email, password })
    setForm(EMPTY)
    setEmail('')
    setPassword(tempPassword())
    await load()
  }

  const openEdit = (i: InstructorCard) => {
    setError(null)
    setEditing(i)
    setEditForm({
      fullName: i.full_name,
      phone: i.phone_number ?? '',
      bio: i.bio ?? '',
      experienceYears: i.experience_years?.toString() ?? '',
      languages: i.languages.join(', '),
      specialties: i.specialties.join(', '),
      serviceArea: i.service_area ?? '',
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setBusy(true)
    setError(null)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: editForm.fullName.trim(), phone_number: editForm.phone.trim() || null })
      .eq('id', editing.profile_id)
    const { error: instructorError } = profileError
      ? { error: null }
      : await supabase.from('instructors').update(toPayload(editForm)).eq('id', editing.id)
    setBusy(false)
    const err = profileError ?? instructorError
    if (err) {
      setError(err.message)
      return
    }
    setEditing(null)
    setNotice(`Saved ${editForm.fullName}'s details.`)
    await load()
  }

  const handlePhoto = async (file: File) => {
    if (!editing) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Please choose an image under 5 MB.')
      return
    }
    setUploading(true)
    setError(null)
    const ext = file.name.split('.').pop()
    const path = `${editing.profile_id}/photo.${ext}`
    const { error: uploadError } = await supabase.storage.from('instructor-photos').upload(path, file, { upsert: true })
    if (uploadError) {
      setUploading(false)
      setError(uploadError.message)
      return
    }
    const { data } = supabase.storage.from('instructor-photos').getPublicUrl(path)
    // Cache-bust so a replaced photo shows immediately
    const url = `${data.publicUrl}?t=${Date.now()}`
    const { error: updateError } = await supabase.from('instructors').update({ photo_url: url }).eq('id', editing.id)
    setUploading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setEditing({ ...editing, photo_url: url })
    await load()
  }

  const handleToggleActive = async () => {
    if (!toggling) return
    setBusy(true)
    const { error: e } = await supabase.from('instructors').update({ active: !toggling.active }).eq('id', toggling.id)
    setBusy(false)
    if (e) setError(e.message)
    else setNotice(`${toggling.full_name} is now ${toggling.active ? 'hidden from students' : 'visible to students again'}.`)
    setToggling(null)
    await load()
  }

  const handlePromote = async (profileId: string) => {
    setPromoting(profileId)
    setError(null)
    const { error: roleError } = await supabase.from('profiles').update({ role: 'instructor' }).eq('id', profileId)
    if (roleError) {
      setError(roleError.message)
      setPromoting(null)
      return
    }
    const { error: instructorError } = await supabase.from('instructors').insert({ profile_id: profileId, bio: '' })
    setPromoting(null)
    if (instructorError) {
      setError(instructorError.message)
      return
    }
    setNotice('Promoted to instructor. Use Edit to add their details and photo.')
    await load()
  }

  if (!instructors) return <PageLoading />

  const matchingCustomers = promoteSearch.trim()
    ? customers.filter((c) => (c.full_name ?? '').toLowerCase().includes(promoteSearch.toLowerCase())).slice(0, 8)
    : []

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-muted text-sm">{instructors.filter((i) => i.active).length} active · {instructors.filter((i) => !i.active).length} inactive</p>
        <Button icon={UserPlus} onClick={() => { setError(null); setAdding(true) }}>Add instructor</Button>
      </div>
      <Alert>{error}</Alert>
      <Alert tone="success">{notice}</Alert>

      {instructors.length === 0 ? (
        <EmptyState icon={Users} title="No instructors yet">Add your first instructor to start taking bookings.</EmptyState>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {instructors.map((i, idx) => (
            <motion.li
              key={i.id}
              initial={m.enabled ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: m.duration(Math.min(idx, 8) * 0.05) }}
            >
              <Card className={`h-full flex flex-col ${i.active ? '' : 'opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <InstructorAvatar name={i.full_name} url={i.photo_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-fg truncate">{i.full_name}</p>
                    {i.rating !== null ? (
                      <span className="flex items-center gap-1.5 text-xs text-muted"><Stars value={i.rating} />{i.rating.toFixed(1)} ({i.review_count})</span>
                    ) : (
                      <span className="text-xs text-muted">No reviews yet</span>
                    )}
                  </div>
                  <Badge status={i.active ? 'active' : 'inactive'} />
                </div>
                <p className="text-sm text-muted mt-3 line-clamp-2 flex-1">{i.bio || 'No bio yet.'}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(i)} className="flex-1">Edit</Button>
                  <Button size="sm" variant={i.active ? 'danger' : 'secondary'} icon={i.active ? Power : RefreshCw} onClick={() => setToggling(i)} className="flex-1">
                    {i.active ? 'Deactivate' : 'Restore'}
                  </Button>
                </div>
              </Card>
            </motion.li>
          ))}
        </ul>
      )}

      <Card className="mt-8">
        <h3 className="font-display font-bold text-fg flex items-center gap-2"><ArrowUpCircle className="size-4 text-accent" />Promote an existing account</h3>
        <p className="text-sm text-muted mt-1 mb-4">If an instructor already signed up as a student, promote their account instead of creating a new one.</p>
        <input
          type="search"
          value={promoteSearch}
          onChange={(e) => setPromoteSearch(e.target.value)}
          placeholder="Search students by name…"
          aria-label="Search students to promote"
          className="w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-fg focus:outline-none focus:border-accent"
        />
        {matchingCustomers.length > 0 && (
          <ul className="mt-3 divide-y divide-border">
            {matchingCustomers.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-fg">{c.full_name ?? 'Unnamed'}</span>
                <Button size="sm" variant="secondary" loading={promoting === c.id} onClick={() => handlePromote(c.id)}>Promote</Button>
              </li>
            ))}
          </ul>
        )}
        {promoteSearch.trim() && matchingCustomers.length === 0 && <p className="text-sm text-muted mt-3">No matching students.</p>}
      </Card>

      <Dialog open={adding} onClose={() => !busy && setAdding(false)} title="Add an instructor" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <DetailsFields value={form} onChange={setForm} />
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <Input label="Login email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div>
              <Input label="Temporary password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required hint="They'll choose their own on first login." />
              <button type="button" onClick={() => setPassword(tempPassword())} className="text-xs text-accent hover:underline mt-1 cursor-pointer">Generate another</button>
            </div>
          </div>
          <Alert>{adding ? error : null}</Alert>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)} disabled={busy}>Cancel</Button>
            <Button type="submit" icon={UserPlus} loading={busy}>Create instructor</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!created} onClose={() => { setCreated(null); setCopied(false) }} title="Instructor created">
        {created && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Share these sign-in details with {created.name}. They&apos;ll be asked to set their own password when they first log in.</p>
            <pre className="rounded-[var(--radius)] bg-surface-2 border border-border p-4 text-sm text-fg whitespace-pre-wrap">{`Login: ${typeof window !== 'undefined' ? window.location.origin : ''}/login\nEmail: ${created.email}\nTemporary password: ${created.password}`}</pre>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                icon={copied ? Check : Copy}
                onClick={async () => {
                  await navigator.clipboard.writeText(`Login: ${window.location.origin}/login\nEmail: ${created.email}\nTemporary password: ${created.password}`)
                  setCopied(true)
                }}
              >
                {copied ? 'Copied' : 'Copy details'}
              </Button>
              <Button onClick={() => { setCreated(null); setCopied(false) }}>Done</Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={!!editing} onClose={() => !busy && setEditing(null)} title={`Edit ${editing?.full_name ?? ''}`} wide>
        {editing && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="flex items-center gap-4">
              <InstructorAvatar name={editing.full_name} url={editing.photo_url} size="lg" />
              <div>
                <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
                <Button variant="secondary" icon={Camera} loading={uploading} onClick={() => fileInput.current?.click()}>
                  {editing.photo_url ? 'Change photo' : 'Upload photo'}
                </Button>
                <p className="text-xs text-muted mt-1.5">JPG or PNG, up to 5 MB.</p>
              </div>
            </div>
            <DetailsFields value={editForm} onChange={setEditForm} />
            <Alert>{editing ? error : null}</Alert>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
              <Button type="submit" loading={busy}>Save changes</Button>
            </div>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!toggling}
        title={toggling?.active ? `Deactivate ${toggling.full_name}?` : `Restore ${toggling?.full_name}?`}
        message={
          toggling?.active
            ? 'They will be hidden from students and can no longer be booked. Past bookings, payments and feedback are kept. You can restore them any time.'
            : 'They will be visible to students and bookable again.'
        }
        confirmLabel={toggling?.active ? 'Deactivate' : 'Restore'}
        danger={toggling?.active}
        loading={busy}
        onClose={() => setToggling(null)}
        onConfirm={handleToggleActive}
      />
    </div>
  )
}
