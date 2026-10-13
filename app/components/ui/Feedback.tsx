'use client'

import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, CheckCircle2, Info, Star } from 'lucide-react'
import { useMotionProfile } from '@/lib/motion'

type Tone = 'error' | 'success' | 'info'

const TONES: Record<Tone, { cls: string; Icon: React.ElementType }> = {
  error: { cls: 'border-danger/30 bg-danger/10 text-danger', Icon: AlertCircle },
  success: { cls: 'border-success/30 bg-success/10 text-success', Icon: CheckCircle2 },
  info: { cls: 'border-accent/30 bg-accent/10 text-fg', Icon: Info },
}

/** Animated inline message. Renders nothing when `children` is empty. */
export function Alert({ tone = 'error', children }: { tone?: Tone; children?: React.ReactNode }) {
  const m = useMotionProfile()
  const { cls, Icon } = TONES[tone]
  return (
    <AnimatePresence initial={false}>
      {children ? (
        <motion.div
          initial={m.enabled ? { opacity: 0, height: 0 } : false}
          animate={{ opacity: 1, height: 'auto' }}
          exit={m.enabled ? { opacity: 0, height: 0 } : undefined}
          transition={{ duration: m.duration(0.25) }}
          className="overflow-hidden"
        >
          <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 border rounded-[var(--radius)] px-3.5 py-2.5 text-sm mb-4 ${cls}`}>
            <Icon className="size-4 mt-0.5 shrink-0" aria-hidden />
            <div>{children}</div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

const BADGE: Record<string, string> = {
  confirmed: 'bg-accent/15 text-accent border-accent/30',
  active: 'bg-accent/15 text-accent border-accent/30',
  completed: 'bg-success/15 text-success border-success/30',
  paid: 'bg-success/15 text-success border-success/30',
  pending: 'bg-danger/10 text-danger border-danger/30',
  cancelled: 'bg-surface-2 text-muted border-border',
  inactive: 'bg-surface-2 text-muted border-border',
}

export function Badge({ status, children }: { status: string; children?: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${BADGE[status] ?? BADGE.cancelled}`}>
      {children ?? status}
    </span>
  )
}

/** Read-only star display. */
export function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'size-3.5' : 'size-5'
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${s} ${n <= Math.round(value) ? 'fill-accent text-accent' : 'text-border'}`} aria-hidden />
      ))}
    </span>
  )
}

/** Clickable 1–5 star picker. */
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const m = useMotionProfile()
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          whileHover={m.hover ? { scale: 1.2, rotate: -8 } : undefined}
          whileTap={m.hover ? { scale: 0.85 } : undefined}
          className="p-0.5 cursor-pointer"
        >
          <Star className={`size-7 transition-colors ${n <= value ? 'fill-accent text-accent' : 'text-muted/50'}`} aria-hidden />
        </motion.button>
      ))}
    </div>
  )
}
