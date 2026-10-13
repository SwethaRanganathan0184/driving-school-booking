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
      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: m.duration(0.45), ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
