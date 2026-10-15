'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { Brush, Check, ImageUp, Palette, RotateCcw, Rocket, Sparkles, Store, Undo2, Wand2 } from 'lucide-react'
import { getAccessToken, supabase } from '@/lib/supabaseClient'
import { DEFAULT_SETTINGS, PRESETS, type PresetId, type SiteSettings } from '@/lib/theme'
import { useMotionProfile } from '@/lib/motion'
import { publishSettings } from '../../actions/settings'
import { useSiteTheme } from '../../components/ThemeProvider'
import LogoMark from '../../components/LogoMark'
import CarIcon from '../../components/CarIcon'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Segmented, Toggle } from '../../components/ui/Controls'
import { Input } from '../../components/ui/Field'
import { Alert } from '../../components/ui/Feedback'

function Section({ icon: Icon, title, hint, children }: { icon: React.ElementType; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="mb-5">
        <h3 className="font-display font-bold text-fg flex items-center gap-2"><Icon className="size-4 text-accent" />{title}</h3>
        {hint && <p className="text-sm text-muted mt-1">{hint}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </Card>
  )
}

/** Live preview of hover, reveal and spring feel. Replays whenever the motion settings change or on demand. */
function MotionPreview({ replayKey }: { replayKey: number }) {
  const m = useMotionProfile()
  return (
    <div key={replayKey} className="rounded-[var(--radius)] border border-dashed border-border p-5 bg-bg/40">
      <p className="text-xs uppercase tracking-widest text-muted mb-4">Preview</p>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={m.enabled ? { opacity: 0, y: m.revealDistance } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: m.duration(0.6), delay: m.duration(i * 0.12), ease: [0.22, 1, 0.36, 1] }}
            whileHover={m.hover ? { y: -4, scale: m.hoverScale } : undefined}
            className="h-16 rounded-[var(--radius)] bg-surface border border-border grid place-items-center text-muted text-xs cursor-default"
          >
            Card {i + 1}
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-5">
        <Button size="sm">Hover me</Button>
        <motion.div
          initial={m.enabled ? { rotate: -180, opacity: 0 } : false}
          animate={{ rotate: 0, opacity: 1 }}
          transition={m.enabled ? { ...m.spring } : { duration: 0 }}
        >
          <LogoMark className="size-8 text-accent" />
        </motion.div>
        <div className="relative flex-1 h-5 overflow-hidden">
          <div className="absolute top-1/2 inset-x-0 h-0.5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,var(--border)_0_10px,transparent_10px_18px)]" />
          <motion.div
            className="absolute top-0"
            initial={{ left: '0%' }}
            animate={{ left: m.enabled ? 'calc(100% - 32px)' : '0%' }}
            transition={{ duration: m.duration(1.6), ease: 'easeInOut' }}
          >
            <CarIcon className="w-8 h-5" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function StudioPanel() {
  const router = useRouter()
  const m = useMotionProfile()
  const { settings: shown, setPreview } = useSiteTheme()
  // Snapshot of what's live for everyone, taken when the Studio opens (before any preview is applied).
  const [published, setPublished] = useState<SiteSettings>(shown)
  const [draft, setDraft] = useState<SiteSettings>(shown)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [replay, setReplay] = useState(0)
  const logoInput = useRef<HTMLInputElement>(null)
  const faviconInput = useRef<HTMLInputElement>(null)

  const dirty = JSON.stringify(draft) !== JSON.stringify(published)

  // Show the draft across the whole site while editing; drop the preview when leaving the Studio.
  useEffect(() => {
    setPreview(draft)
  }, [draft, setPreview])
  useEffect(() => () => setPreview(null), [setPreview])

  // Warn before closing the tab with unpublished changes.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const update = (patch: Partial<SiteSettings>) => setDraft((d) => ({ ...d, ...patch }))
  const updateMotion = (patch: Partial<SiteSettings['motion']>) => {
    setDraft((d) => ({ ...d, motion: { ...d.motion, ...patch } }))
    setReplay((r) => r + 1)
  }
  const updateContact = (patch: Partial<SiteSettings['contact']>) => setDraft((d) => ({ ...d, contact: { ...d.contact, ...patch } }))

  const handlePublish = async () => {
    setSaving(true)
    setError(null)
    const result = await publishSettings(await getAccessToken(), draft)
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPublished(result.settings)
    setDraft(result.settings)
    setSavedAt(Date.now())
    router.refresh()
  }

  const upload = async (kind: 'logo' | 'favicon', file: File) => {
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
      setError('Please choose an image under 2 MB.')
      return
    }
    setUploading(kind)
    setError(null)
    const ext = file.name.split('.').pop()
    const path = `branding/${kind}-${crypto.randomUUID().slice(0, 8)}.${ext}`
    const { error: uploadError } = await supabase.storage.from('site-assets').upload(path, file, { upsert: true, cacheControl: '31536000' })
    setUploading(null)
    if (uploadError) {
      setError(uploadError.message.includes('not found') ? 'Storage bucket "site-assets" is missing. Run the latest SQL migration.' : uploadError.message)
      return
    }
    const url = supabase.storage.from('site-assets').getPublicUrl(path).data.publicUrl
    update(kind === 'logo' ? { logoUrl: url } : { faviconUrl: url })
  }

  const accentValue = draft.accentOverride ?? PRESETS[draft.preset].swatches[2]

  return (
    <div className="pb-28">
      <div className="grid lg:grid-cols-2 gap-5">
        <Section icon={Palette} title="Theme preset" hint="One click restyles the whole site. Visitors can still flip to the light theme with the sun/moon button.">
          <div className="grid sm:grid-cols-3 gap-3">
            {(Object.keys(PRESETS) as PresetId[]).map((id) => {
              const p = PRESETS[id]
              const active = draft.preset === id
              return (
                <motion.button
                  key={id}
                  type="button"
                  onClick={() => update({ preset: id, accentOverride: null })}
                  whileHover={m.hover ? { y: -3 } : undefined}
                  whileTap={m.hover ? { scale: m.pressScale } : undefined}
                  aria-pressed={active}
                  className={`relative text-left rounded-[var(--radius)] border-2 p-3 cursor-pointer transition-colors ${active ? 'border-accent' : 'border-border hover:border-accent/40'}`}
                >
                  <div className="h-16 rounded-[calc(var(--radius)-4px)] overflow-hidden flex" style={{ background: p.swatches[0] }}>
                    <div className="m-2 flex-1 rounded-md p-2 flex flex-col justify-between" style={{ background: p.swatches[1] }}>
                      <div className="h-1.5 w-2/3 rounded-full opacity-40" style={{ background: p.swatches[0] === '#F6F7FA' ? '#101626' : '#fff' }} />
                      <div className="h-3 w-10 rounded-full" style={{ background: p.swatches[2] }} />
                    </div>
                  </div>
                  <p className="font-semibold text-fg text-sm mt-2">{p.label}</p>
                  <p className="text-xs text-muted leading-snug">{p.description}</p>
                  {active && (
                    <span className="absolute top-2 right-2 grid place-items-center size-5 rounded-full bg-accent text-accent-fg">
                      <Check className="size-3" />
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </Section>

        <Section icon={Brush} title="Look & feel">
          <div>
            <p className="text-sm font-medium text-fg mb-1.5">Accent colour</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentValue}
                onChange={(e) => update({ accentOverride: e.target.value })}
                aria-label="Accent colour"
                className="h-10 w-14 rounded-[var(--radius)] border border-border bg-surface-2 cursor-pointer"
              />
              <input
                value={accentValue.toUpperCase()}
                onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && update({ accentOverride: e.target.value })}
                aria-label="Accent colour hex"
                className="w-28 rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2 text-sm font-mono text-fg"
              />
              {draft.accentOverride && (
                <Button variant="ghost" size="sm" icon={Undo2} onClick={() => update({ accentOverride: null })}>Preset colour</Button>
              )}
            </div>
          </div>
          <Segmented label="Corners" value={draft.radius} onChange={(radius) => update({ radius })}
            options={[{ value: 'sharp', label: 'Sharp' }, { value: 'soft', label: 'Soft' }, { value: 'round', label: 'Round' }]} />
          <Segmented label="Background" value={draft.background} onChange={(background) => update({ background })}
            options={[{ value: 'none', label: 'None' }, { value: 'glow', label: 'Glow' }, { value: 'grid', label: 'Grid' }, { value: 'road', label: 'Road lines' }]} />
        </Section>

        <Section icon={Sparkles} title="Motion & animation" hint="Visitors who prefer reduced motion always get a calm, static site.">
          <Segmented label="Intensity" value={draft.motion.intensity} onChange={(intensity) => updateMotion({ intensity })}
            options={[{ value: 'off', label: 'Off' }, { value: 'subtle', label: 'Subtle' }, { value: 'playful', label: 'Playful' }]} />
          <div>
            <label htmlFor="speed" className="flex justify-between text-sm font-medium text-fg mb-1.5">
              Speed <span className="text-muted tabular-nums">{draft.motion.speed.toFixed(2)}×</span>
            </label>
            <input id="speed" type="range" min={0.5} max={2} step={0.05} value={draft.motion.speed}
              disabled={draft.motion.intensity === 'off'}
              onChange={(e) => updateMotion({ speed: Number(e.target.value) })} className="w-full disabled:opacity-40" />
            <div className="flex justify-between text-xs text-muted mt-1"><span>Relaxed</span><span>Snappy</span></div>
          </div>
          <div className="space-y-4">
            <Toggle label="Scroll animations" hint="Steering wheel, journey and reveal-on-scroll" checked={draft.motion.scrollEffects} onChange={(scrollEffects) => updateMotion({ scrollEffects })} />
            <Toggle label="Hover & press effects" hint="Buttons and cards lift and spring" checked={draft.motion.hoverEffects} onChange={(hoverEffects) => updateMotion({ hoverEffects })} />
            <Toggle label="Page transitions" hint="Pages fade in when navigating" checked={draft.motion.pageTransitions} onChange={(pageTransitions) => updateMotion({ pageTransitions })} />
          </div>
          <MotionPreview replayKey={replay} />
          <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => setReplay((r) => r + 1)}>Replay animations</Button>
        </Section>

        <Section icon={Wand2} title="Branding">
          <Input label="Site name" maxLength={40} value={draft.siteName} onChange={(e) => update({ siteName: e.target.value })} />
          <Input label="Tagline" maxLength={120} hint="Shown as the home page headline." value={draft.tagline} onChange={(e) => update({ tagline: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-4">
            {(['logo', 'favicon'] as const).map((kind) => {
              const url = kind === 'logo' ? draft.logoUrl : draft.faviconUrl
              const input = kind === 'logo' ? logoInput : faviconInput
              return (
                <div key={kind}>
                  <p className="text-sm font-medium text-fg mb-1.5">{kind === 'logo' ? 'Logo' : 'Favicon'}</p>
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-[var(--radius)] border border-border bg-surface-2 grid place-items-center overflow-hidden">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="" className="size-10 object-contain" />
                      ) : (
                        <LogoMark className="size-7 text-accent" />
                      )}
                    </div>
                    <input ref={input} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp,image/x-icon" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(kind, f); e.target.value = '' }} />
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="secondary" icon={ImageUp} loading={uploading === kind} onClick={() => input.current?.click()}>Upload</Button>
                      {url && (
                        <button type="button" onClick={() => update(kind === 'logo' ? { logoUrl: null } : { faviconUrl: null })} className="text-xs text-muted hover:text-danger cursor-pointer">
                          Use default
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        <Section icon={Store} title="Business details" hint="Used for pricing on the site and new bookings, and in the footer.">
          <Input label="Price per class (₹)" type="number" min={0} max={100000} value={draft.pricePerClass}
            onChange={(e) => update({ pricePerClass: Math.max(0, Number(e.target.value) || 0) })}
            hint="Existing packages keep the price they were booked at." />
          <Input label="Address" value={draft.contact.address} onChange={(e) => updateContact({ address: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Phone" type="tel" value={draft.contact.phone} onChange={(e) => updateContact({ phone: e.target.value })} />
            <Input label="Email" type="email" value={draft.contact.email} onChange={(e) => updateContact({ email: e.target.value })} />
          </div>
        </Section>
      </div>

      <AnimatePresence>
        {(dirty || error || savedAt) && (
          <motion.div
            initial={m.enabled ? { y: 80, opacity: 0 } : false}
            animate={{ y: 0, opacity: 1 }}
            exit={m.enabled ? { y: 80, opacity: 0 } : undefined}
            transition={m.spring}
            className="fixed bottom-4 inset-x-4 z-30 mx-auto max-w-3xl"
          >
            <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-accent/40 bg-surface/95 backdrop-blur-xl shadow-2xl px-4 py-3">
              <div className="flex-1 min-w-48 text-sm">
                {error ? (
                  <Alert>{error}</Alert>
                ) : dirty ? (
                  <span className="text-fg"><span className="inline-block size-2 rounded-full bg-accent mr-2" />Previewing unpublished changes. Only you can see them.</span>
                ) : (
                  <span className="text-success flex items-center gap-2"><Check className="size-4" />Published. Everyone now sees this look.</span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDraft({ ...DEFAULT_SETTINGS, contact: draft.contact, pricePerClass: draft.pricePerClass, siteName: draft.siteName, tagline: draft.tagline })}>
                Reset look
              </Button>
              {dirty && <Button variant="secondary" size="sm" icon={Undo2} onClick={() => { setDraft(published); setError(null) }}>Discard</Button>}
              <Button size="sm" icon={Rocket} loading={saving} disabled={!dirty} onClick={handlePublish}>Publish</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
