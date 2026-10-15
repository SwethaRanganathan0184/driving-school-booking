'use client'

import { motion } from 'motion/react'
import { useMotionProfile } from '@/lib/motion'

/** Re-mounts on every navigation, giving each page a short enter transition (toggle in Studio → Motion). */
export default function Template({ children }: { children: React.ReactNode }) {
  const m = useMotionProfile()
  if (!m.pageTransitions) return <div className="flex-1 flex flex-col">{children}</div>

  return (
    <motion.div
      className="flex-1 flex flex-col"
      // Opacity only: a leftover filter or transform on this wrapper would pin every position:fixed
      // child (Studio publish bar, dialogs) to the page instead of the screen.
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: m.duration(0.3), ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
