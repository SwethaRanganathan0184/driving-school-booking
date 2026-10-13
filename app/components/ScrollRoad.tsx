'use client'

import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { useMotionProfile } from '@/lib/motion'
import CarIcon from './CarIcon'

/** Thin road along the bottom of the navbar. A car drives along it as the page scrolls (doubles as a progress bar). */
export default function ScrollRoad() {
  const m = useMotionProfile()
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 })
  const left = useTransform(smooth, (v) => `calc(${(v * 100).toFixed(3)}% - ${(v * 32).toFixed(2)}px)`)
  const trail = useTransform(smooth, (v) => `${(v * 100).toFixed(3)}%`)
  const opacity = useTransform(scrollYProgress, [0, 0.02], [0, 1])

  if (!m.scroll) return null

  return (
    <motion.div style={{ opacity }} className="absolute left-0 right-0 -bottom-[3px] h-[3px] pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,var(--border)_0_14px,transparent_14px_24px)]" />
      <motion.div style={{ width: trail }} className="absolute inset-y-0 left-0 bg-accent/70" />
      <motion.div style={{ left }} className="absolute -top-[9px]">
        <CarIcon className="w-8 h-5 drop-shadow-[0_0_6px_var(--accent)]" />
      </motion.div>
    </motion.div>
  )
}
