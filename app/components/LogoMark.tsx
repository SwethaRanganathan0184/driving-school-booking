export default function LogoMark({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" />
      <line x1="24" y1="24" x2="24" y2="4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="24" x2="41.3" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="24" x2="6.7" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="6" fill="currentColor" />
    </svg>
  )
}