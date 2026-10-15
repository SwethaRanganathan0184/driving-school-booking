'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { useMotionProfile } from '@/lib/motion'
import { CarShape } from '../CarIcon'

const ROAD = 'M 40 470 C 220 470 210 330 380 320 S 600 170 720 200 S 900 150 960 60'

const STEPS = [
  { at: 0.04, title: 'Sign up', body: 'Create an account with email or Google in under a minute.' },
  { at: 0.36, title: 'Add your car', body: 'Lessons happen in your own car. Tell us the make and transmission.' },
  { at: 0.68, title: 'Book a slot', body: 'Pick an instructor and an hour that suits you.' },
  { at: 0.97, title: 'Drive, then pay', body: 'Take your lesson and settle up in person afterwards.' },
]

/** "How it works" as a winding road. Scrolling drives a car along it and lights up each step as it passes. */
export default function Journey() {
  const m = useMotionProfile()
  const section = useRef<HTMLDivElement>(null)
  const road = useRef<SVGPathElement>(null)
  const car = useRef<SVGGElement>(null)
  const [markers, setMarkers] = useState<{ x: number; y: number }[]>([])
  const [reached, setReached] = useState(m.scroll ? 0 : STEPS.length)

  const { scrollYProgress } = useScroll({ target: section, offset: ['start 0.75', 'end 0.55'] })
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1], { clamp: true })

  const placeCar = (v: number) => {
    const path = road.current
    if (!path || !car.current) return
    const len = path.getTotalLength()
    const d = Math.min(len, Math.max(0, v * len))
    const p = path.getPointAtLength(d)
    const ahead = path.getPointAtLength(Math.min(len, d + 1))
    const behind = path.getPointAtLength(Math.max(0, d - 1))
    const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI
    car.current.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${angle}) scale(1.6)`)
  }

  useEffect(() => {
    const path = road.current
    if (!path) return
    const len = path.getTotalLength()
    setMarkers(STEPS.map((s) => {
      const p = path.getPointAtLength(s.at * len)
      return { x: p.x, y: p.y }
    }))
    placeCar(m.scroll ? progress.get() : 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.scroll])

  useMotionValueEvent(progress, 'change', (v) => {
    if (!m.scroll) return
    placeCar(v)
    const count = STEPS.filter((s) => v >= s.at - 0.02).length
    setReached((r) => (r === count ? r : count))
  })

  const shown = m.scroll ? reached : STEPS.length

  return (
    <div ref={section}>
      <div className="relative">
        <svg viewBox="0 0 1000 520" className="w-full h-auto" aria-hidden>
          <path d={ROAD} fill="none" stroke="var(--border)" strokeWidth="46" strokeLinecap="round" />
          <path ref={road} d={ROAD} fill="none" stroke="var(--surface-2)" strokeWidth="40" strokeLinecap="round" />
          <path d={ROAD} fill="none" stroke="var(--muted)" strokeOpacity="0.5" strokeWidth="2.5" strokeDasharray="16 18" />
          <motion.path
            d={ROAD}
            fill="none"
            stroke="var(--accent)"
            strokeOpacity="0.85"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ pathLength: m.scroll ? progress : 1 }}
          />
          {markers.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y})`}>
              <circle r="20" fill={i < shown ? 'var(--accent)' : 'var(--surface)'} stroke="var(--accent)" strokeWidth="3" style={{ transition: 'fill .4s' }} />
              <text textAnchor="middle" dy="6" fontSize="17" fontWeight="700" fill={i < shown ? 'var(--accent-fg)' : 'var(--accent)'} style={{ transition: 'fill .4s' }}>
                {i + 1}
              </text>
            </g>
          ))}
          <g ref={car}>
            <CarShape />
          </g>
        </svg>
      </div>

      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 mt-8">
        {STEPS.map(({ title, body }, i) => {
          const on = i < shown
          return (
            <motion.li
              key={title}
              animate={{ opacity: on ? 1 : 0.5 }}
              transition={{ duration: m.duration(0.3) }}
              className={`border-t-2 pt-4 transition-colors ${on ? 'border-accent' : 'border-border'}`}
            >
              <h3 className="font-semibold text-fg">
                <span className="text-muted tabular-nums mr-2">{i + 1}.</span>
                {title}
              </h3>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{body}</p>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
