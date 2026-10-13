'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useMotionProfile } from '@/lib/motion'
import Button from './Button'

/** Accessible modal: Escape closes, focus moves into the dialog, page scroll is locked while open. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  wide?: boolean
}) {
  const m = useMotionProfile()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const previouslyFocused = document.activeElement as HTMLElement | null
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: m.duration(0.2) }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={m.enabled ? { opacity: 0, y: 24, scale: 0.97 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={m.enabled ? { opacity: 0, y: 16, scale: 0.98 } : undefined}
            transition={m.spring}
            className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-[var(--radius)] shadow-2xl p-6 focus:outline-none`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="font-display text-lg font-bold text-fg">{title}</h2>
              <button type="button" onClick={onClose} className="text-muted hover:text-fg cursor-pointer" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Yes/no confirmation built on Dialog. Replaces window.confirm. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="text-muted mb-6">{message}</div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
