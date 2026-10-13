import { initials } from '@/lib/instructors'

export default function InstructorAvatar({ name, url, size = 'md' }: { name: string; url: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'size-10 text-sm', md: 'size-16 text-lg', lg: 'size-24 text-2xl' }[size]
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className={`${s} rounded-full object-cover border-2 border-border shrink-0`} />
  }
  return (
    <div className={`${s} rounded-full grid place-items-center bg-accent/15 text-accent font-display font-bold border-2 border-accent/30 shrink-0`} aria-hidden>
      {initials(name)}
    </div>
  )
}
