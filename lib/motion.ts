'use client'

import { useReducedMotion } from 'motion/react'
import { useSiteTheme } from '@/app/components/ThemeProvider'
import type { MotionIntensity } from '@/lib/theme'

export type MotionProfile = {
  /** False when animations are off (admin setting or the visitor's reduced-motion preference). */
  enabled: boolean
  hover: boolean
  scroll: boolean
  pageTransitions: boolean
  /** Scale applied while hovering / pressing interactive elements. */
  hoverScale: number
  pressScale: number
  /** Distance (px) elements travel when they reveal on scroll. */
  revealDistance: number
  spring: { type: 'spring'; stiffness: number; damping: number }
  /** Converts a base duration in seconds to the admin's chosen speed. */
  duration: (seconds: number) => number
}

type Feel = Pick<MotionProfile, 'hoverScale' | 'pressScale' | 'revealDistance'> & {
  stiffness: number
  damping: number
}

/** How each intensity level feels. These numbers drive every hover, press, reveal and spring in the app. */
export function feelFor(intensity: MotionIntensity): Feel {
  switch (intensity) {
    case 'playful':
      return { hoverScale: 1.06, pressScale: 0.93, revealDistance: 40, stiffness: 260, damping: 14 }
    case 'subtle':
      return { hoverScale: 1.02, pressScale: 0.98, revealDistance: 16, stiffness: 300, damping: 28 }
    case 'off':
    default:
      return { hoverScale: 1, pressScale: 1, revealDistance: 0, stiffness: 400, damping: 40 }
  }
}

export function useMotionProfile(): MotionProfile {
  const { settings } = useSiteTheme()
  const reduced = useReducedMotion()
  const { intensity, speed, scrollEffects, hoverEffects, pageTransitions } = settings.motion
  const enabled = intensity !== 'off' && !reduced
  const feel = feelFor(enabled ? intensity : 'off')

  return {
    enabled,
    hover: enabled && hoverEffects,
    scroll: enabled && scrollEffects,
    pageTransitions: enabled && pageTransitions,
    hoverScale: feel.hoverScale,
    pressScale: feel.pressScale,
    revealDistance: feel.revealDistance,
    spring: { type: 'spring', stiffness: feel.stiffness * speed, damping: feel.damping },
    duration: (seconds) => (enabled ? seconds / speed : 0),
  }
}
