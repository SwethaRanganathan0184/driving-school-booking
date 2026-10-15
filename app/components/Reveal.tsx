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

  // Always a motion.div (initial={false} when off) so toggling the setting never remounts the children.
  return (
    <motion.div
      className={className}
      initial={m.scroll ? { opacity: 0, y: m.revealDistance } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: m.duration(0.7), delay: m.duration(delay), ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
