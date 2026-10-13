/** Steering-wheel mark. Uses currentColor so it follows the theme; the 12 o'clock gap is the wheel's centre marker. */
export default function LogoMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M20 4.4A20 20 0 1 0 28 4.4"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path d="M21 4.1h6" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" opacity="0.35" />
      <path d="M24 24L5.5 28M24 24l18.5 4M24 24v17" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="24" cy="24" r="6.2" fill="currentColor" />
      <circle cx="24" cy="24" r="2.4" fill="var(--bg, #0b1020)" />
    </svg>
  )
}
