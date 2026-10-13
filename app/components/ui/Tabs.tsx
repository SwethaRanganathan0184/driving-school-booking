'use client'

import { motion } from 'motion/react'
import { useId } from 'react'
import { useMotionProfile } from '@/lib/motion'

export type TabItem<T extends string> = { id: T; label: string; icon?: React.ElementType; count?: number }

/** Segmented tab bar with a sliding highlight. */
export function Tabs<T extends string>({ items, value, onChange }: { items: TabItem<T>[]; value: T; onChange: (id: T) => void }) {
  const m = useMotionProfile()
  const group = useId()
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto p-1 bg-surface border border-border rounded-[var(--radius)] mb-6 -mx-1 sm:mx-0">
      {items.map(({ id, label, icon: Icon, count }) => {
        const active = id === value
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`relative shrink-0 flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-[calc(var(--radius)-4px)] cursor-pointer transition-colors ${
              active ? 'text-accent-fg' : 'text-muted hover:text-fg'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`tab-${group}`}
                className="absolute inset-0 bg-accent rounded-[calc(var(--radius)-4px)]"
                transition={m.enabled ? m.spring : { duration: 0 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {Icon && <Icon className="size-4" aria-hidden />}
              {label}
              {count !== undefined && (
                <span className={`text-xs rounded-full px-1.5 ${active ? 'bg-accent-fg/15' : 'bg-surface-2'}`}>{count}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
