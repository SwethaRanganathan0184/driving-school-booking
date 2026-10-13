'use client'

import { motion } from 'motion/react'
import { useMotionProfile } from '@/lib/motion'

/** Fades and slides children in when they scroll into view. Distance and speed follow the Studio motion settings. */
export default function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const m = useMotionProfile()

  if (!m.scroll) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: m.revealDistance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: m.duration(0.7), delay: m.duration(delay), ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
