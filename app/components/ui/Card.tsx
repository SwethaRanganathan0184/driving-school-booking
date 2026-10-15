'use client'

import { motion } from 'motion/react'
import { useMotionProfile } from '@/lib/motion'

type Props = {
  /** Lifts slightly and highlights its border on hover. Use for clickable cards. */
  interactive?: boolean
  className?: string
  children: React.ReactNode
}

export default function Card({ interactive, className = '', children }: Props) {
  const m = useMotionProfile()
  return (
    <motion.div
      whileHover={interactive && m.hover ? { y: -2 } : undefined}
      transition={m.spring}
      className={`bg-surface border border-border rounded-[var(--radius)] p-5 transition-colors duration-200 ${
        interactive ? 'hover:border-muted/50' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  )
}
