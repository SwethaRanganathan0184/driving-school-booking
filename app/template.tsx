'use client'

import { motion } from 'motion/react'
import { useMotionProfile } from '@/lib/motion'

/** Re-mounts on every navigation, giving each page a short fade-in (skipped when motion is off). */
export default function Template({ children }: { children: React.ReactNode }) {
  const m = useMotionProfile()

  // Always the same element: switching between motion.div and a plain div on a settings change
  // made React rebuild the whole page (the Studio "refreshed" and lost its draft).
  // Opacity only: a leftover filter or transform here would pin position:fixed children to the page.
  return (
    <motion.div
      className="flex-1 flex flex-col"
      initial={m.enabled ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: m.duration(0.3), ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
