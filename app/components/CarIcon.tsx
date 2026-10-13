/** Top-down car, facing right. Drawn in SVG units so it can be placed inside other SVGs. */
export function CarShape({ color = 'var(--accent)' }: { color?: string }) {
  return (
    <g>
      <rect x="-14" y="-8" width="28" height="16" rx="5" fill={color} />
      <rect x="1" y="-6" width="7" height="12" rx="2" fill="var(--bg)" opacity="0.75" />
      <rect x="-10" y="-6" width="5" height="12" rx="2" fill="var(--bg)" opacity="0.55" />
      <rect x="12" y="-6.5" width="2.2" height="3" rx="1" fill="#fff7d6" />
      <rect x="12" y="3.5" width="2.2" height="3" rx="1" fill="#fff7d6" />
    </g>
  )
}

export default function CarIcon({ className = 'w-8 h-5' }: { className?: string }) {
  return (
    <svg viewBox="-16 -10 32 20" className={className} aria-hidden="true">
      <CarShape />
    </svg>
  )
}
