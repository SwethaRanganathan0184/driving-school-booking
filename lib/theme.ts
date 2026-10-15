export type PresetId = 'midnight' | 'racing' | 'light'
export type MotionIntensity = 'off' | 'subtle' | 'playful'
export type BackgroundStyle = 'none' | 'glow' | 'grid' | 'road'
export type RadiusStyle = 'sharp' | 'soft' | 'round'

export type SiteSettings = {
  preset: PresetId
  accentOverride: string | null
  radius: RadiusStyle
  background: BackgroundStyle
  motion: {
    intensity: MotionIntensity
    speed: number
    scrollEffects: boolean
    hoverEffects: boolean
    pageTransitions: boolean
  }
  siteName: string
  tagline: string
  logoUrl: string | null
  faviconUrl: string | null
  pricePerClass: number
  contact: { address: string; phone: string; email: string }
}

export const PRESETS: Record<
  PresetId,
  { label: string; description: string; swatches: [string, string, string] }
> = {
  midnight: {
    label: 'Midnight Gold',
    description: 'Deep navy with warm gold accents. The default look.',
    swatches: ['#070B14', '#0E1526', '#D4A93C'],
  },
  racing: {
    label: 'Racing Red',
    description: 'Charcoal and red with a high-contrast, sporty feel.',
    swatches: ['#0B0B0D', '#151518', '#E5252A'],
  },
  light: {
    label: 'Daylight',
    description: 'Clean light surfaces with a gold accent.',
    swatches: ['#F6F7FA', '#FFFFFF', '#B8912F'],
  },
}

export const RADIUS_PX: Record<RadiusStyle, number> = { sharp: 6, soft: 14, round: 24 }

export const DEFAULT_SETTINGS: SiteSettings = {
  preset: 'midnight',
  accentOverride: null,
  radius: 'soft',
  background: 'none',
  motion: {
    intensity: 'subtle',
    speed: 1,
    scrollEffects: true,
    hoverEffects: true,
    pageTransitions: true,
  },
  siteName: 'DriveWise',
  tagline: 'Control the Wheel. Command the Road.',
  logoUrl: null,
  faviconUrl: null,
  pricePerClass: 400,
  contact: { address: '', phone: '', email: '' },
}

const HEX = /^#[0-9a-fA-F]{6}$/

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function text(value: unknown, fallback: string, max = 200) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : fallback
}

function url(value: unknown) {
  return typeof value === 'string' && /^https?:\/\//.test(value) ? value : null
}

/** Validates untrusted JSON (from the database) into a complete, safe SiteSettings object. */
export function mergeSettings(raw: unknown): SiteSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const m = (r.motion && typeof r.motion === 'object' ? r.motion : {}) as Record<string, unknown>
  const d = DEFAULT_SETTINGS
  const c = (r.contact && typeof r.contact === 'object' ? r.contact : {}) as Record<string, unknown>
  const price = typeof r.pricePerClass === 'number' && isFinite(r.pricePerClass) ? Math.round(r.pricePerClass) : d.pricePerClass
  const speed = typeof m.speed === 'number' && isFinite(m.speed) ? m.speed : d.motion.speed

  return {
    preset: pick(r.preset, ['midnight', 'racing', 'light'], d.preset),
    accentOverride:
      typeof r.accentOverride === 'string' && HEX.test(r.accentOverride) ? r.accentOverride : null,
    radius: pick(r.radius, ['sharp', 'soft', 'round'], d.radius),
    background: pick(r.background, ['none', 'glow', 'grid', 'road'], d.background),
    motion: {
      intensity: pick(m.intensity, ['off', 'subtle', 'playful'], d.motion.intensity),
      speed: Math.min(2, Math.max(0.5, speed)),
      scrollEffects: bool(m.scrollEffects, d.motion.scrollEffects),
      hoverEffects: bool(m.hoverEffects, d.motion.hoverEffects),
      pageTransitions: bool(m.pageTransitions, d.motion.pageTransitions),
    },
    siteName: text(r.siteName, d.siteName, 40),
    tagline: text(r.tagline, d.tagline, 120),
    logoUrl: url(r.logoUrl),
    faviconUrl: url(r.faviconUrl),
    pricePerClass: Math.min(100000, Math.max(0, price)),
    contact: {
      address: text(c.address, '', 200),
      phone: text(c.phone, '', 40),
      email: text(c.email, '', 120),
    },
  }
}

/** Picks black or white text for readable contrast on the given hex colour. */
export function readableOn(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#0b1020' : '#ffffff'
}

/** CSS variables that the settings override on top of the preset (accent, radius, motion speed). */
export function settingsToVars(s: SiteSettings): Record<string, string> {
  const vars: Record<string, string> = {
    '--radius': `${RADIUS_PX[s.radius]}px`,
    '--motion-speed': String(s.motion.intensity === 'off' ? 1 : s.motion.speed),
  }
  if (s.accentOverride) {
    vars['--accent'] = s.accentOverride
    vars['--accent-fg'] = readableOn(s.accentOverride)
  }
  return vars
}

export const VAR_KEYS = ['--radius', '--motion-speed', '--accent', '--accent-fg'] as const
