'use client'

import { motion } from 'motion/react'
import { useId } from 'react'
import { useMotionProfile } from '@/lib/motion'

/** Small segmented control for picking one of a few options. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const m = useMotionProfile()
  const group = useId()
  return (
    <div>
      <p className="text-sm font-medium text-fg mb-1.5" id={group}>{label}</p>
      <div role="radiogroup" aria-labelledby={group} className="inline-flex flex-wrap gap-1 p-1 rounded-[var(--radius)] border border-border bg-surface-2">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={`relative px-3 py-1.5 text-sm rounded-[calc(var(--radius)-4px)] cursor-pointer transition-colors ${active ? 'text-accent-fg' : 'text-muted hover:text-fg'}`}
            >
              {active && (
                <motion.span layoutId={`seg-${group}`} className="absolute inset-0 bg-accent rounded-[calc(var(--radius)-4px)]" transition={m.enabled ? m.spring : { duration: 0 }} />
              )}
              <span className="relative">{o.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const m = useMotionProfile()
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <span>
        <span className="block text-sm font-medium text-fg">{label}</span>
        {hint && <span className="block text-xs text-muted mt-0.5">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full border transition-colors cursor-pointer ${checked ? 'bg-accent border-accent' : 'bg-surface-2 border-border'}`}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 size-[18px] rounded-full bg-white shadow"
          animate={{ x: checked ? 20 : 0 }}
          transition={m.enabled ? { type: 'spring', stiffness: 500, damping: 30 } : { duration: 0 }}
        />
      </button>
    </label>
  )
}
