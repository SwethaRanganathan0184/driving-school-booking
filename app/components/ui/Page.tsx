'use client'

import { motion } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { useMotionProfile } from '@/lib/motion'

/** Standard app page: title, optional subtitle and actions, and a width-limited body. */
export function Page({
  title,
  subtitle,
  actions,
  width = 'md',
  children,
}: {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  width?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}) {
  const m = useMotionProfile()
  const max = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }[width]
  return (
    <main className="flex-1 px-4 sm:px-6 py-10 sm:py-14">
      <div className={`${max} mx-auto`}>
        <motion.header
          initial={m.enabled ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: m.duration(0.5) }}
          className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg">{title}</h1>
            {subtitle && <p className="text-muted mt-1.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
        </motion.header>
        {children}
      </div>
    </main>
  )
}

export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24 text-muted" role="status">
      <Loader2 className="size-6 animate-spin text-accent" aria-hidden />
      <span className="text-sm">{label}…</span>
    </div>
  )
}

export function PageMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 px-6 py-24">
      <h1 className="font-display text-xl font-bold text-fg">{title}</h1>
      {children && <div className="text-muted max-w-sm">{children}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children }: { icon?: React.ElementType; title: string; children?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-border rounded-[var(--radius)] px-6 py-12 text-center">
      {Icon && <Icon className="size-8 mx-auto text-muted mb-3" aria-hidden />}
      <p className="font-medium text-fg">{title}</p>
      {children && <div className="text-sm text-muted mt-1">{children}</div>}
    </div>
  )
}
