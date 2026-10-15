'use client'

import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { useMotionProfile } from '@/lib/motion'

/** Large hero steering wheel. Spins in on load, then turns with the page scroll (and back when scrolling up). */
export default function SteeringWheel({ className = '' }: { className?: string }) {
  const m = useMotionProfile()
  const { scrollY } = useScroll()
  const turn = useTransform(scrollY, [0, 900], [0, 270])
  const rotate = useSpring(turn, { stiffness: 90, damping: 20, mass: 0.6 })

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={m.enabled ? { rotate: -40, opacity: 0 } : false}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: m.duration(0.9), ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={m.scroll ? { rotate } : undefined}
          aria-hidden
        >
          <defs>
            <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--fg)" stopOpacity="0.9" />
              <stop offset="1" stopColor="var(--fg)" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          {/* rim + grip texture */}
          <circle cx="100" cy="100" r="86" fill="none" stroke="url(#rim)" strokeWidth="14" />
          <circle cx="100" cy="100" r="86" fill="none" stroke="var(--bg)" strokeOpacity="0.35" strokeWidth="14" strokeDasharray="1.5 6" />
          <circle cx="100" cy="100" r="79" fill="none" stroke="var(--border)" strokeWidth="1" />
          {/* 12 o'clock centre marker */}
          <path d="M92 14.5 A86 86 0 0 1 108 14.5" stroke="var(--accent)" strokeWidth="14" fill="none" />
          {/* spokes */}
          <path d="M100 100 L22 116 M100 100 L178 116 M100 100 L100 180" stroke="var(--fg)" strokeOpacity="0.75" strokeWidth="13" strokeLinecap="round" />
          {/* hub */}
          <circle cx="100" cy="100" r="30" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="2" />
          <circle cx="100" cy="100" r="21" fill="none" stroke="var(--accent)" strokeWidth="3" />
          <circle cx="100" cy="100" r="7" fill="var(--accent)" />
        </motion.svg>
      </motion.div>
    </div>
  )
}
