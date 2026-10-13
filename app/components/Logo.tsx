'use client'

import Link from 'next/link'
import LogoMark from './LogoMark'
import { useSiteTheme } from './ThemeProvider'

/** Mark + site name. Uses the admin's uploaded logo and name when set in the Studio. */
export default function Logo({ className = '' }: { className?: string }) {
  const { settings } = useSiteTheme()
  return (
    <Link href="/" className={`group flex items-center gap-2.5 ${className}`} aria-label={`${settings.siteName} home`}>
      {settings.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.logoUrl} alt="" className="size-8 object-contain" />
      ) : (
        <LogoMark className="size-8 text-accent transition-transform duration-700 ease-out group-hover:rotate-[120deg]" />
      )}
      <span className="font-display font-bold tracking-tight text-fg">{settings.siteName}</span>
    </Link>
  )
}
