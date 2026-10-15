'use client'

import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import LogoMark from './LogoMark'
import { useSiteTheme } from './ThemeProvider'

export default function Footer() {
  const { settings } = useSiteTheme()
  const { address, phone, email } = settings.contact

  return (
    <footer className="border-t border-border bg-surface/50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7 text-accent" />
            <span className="font-display font-bold text-fg">{settings.siteName}</span>
          </div>
          <p className="text-sm text-muted mt-3 max-w-xs">{settings.tagline}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-fg mb-3">Explore</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/customer" className="text-fg/80 hover:text-accent transition-colors">Find an instructor</Link></li>
            <li><Link href="/signup" className="text-fg/80 hover:text-accent transition-colors">Create an account</Link></li>
            <li><Link href="/login" className="text-fg/80 hover:text-accent transition-colors">Instructor &amp; student login</Link></li>
          </ul>
        </div>
        {(address || phone || email) && (
          <div>
            <h2 className="text-sm font-medium text-fg mb-3">Contact</h2>
            <ul className="space-y-2 text-sm text-fg/80">
              {address && <li className="flex gap-2"><MapPin className="size-4 mt-0.5 text-accent shrink-0" aria-hidden />{address}</li>}
              {phone && <li className="flex gap-2"><Phone className="size-4 mt-0.5 text-accent shrink-0" aria-hidden /><a href={`tel:${phone}`} className="hover:text-accent">{phone}</a></li>}
              {email && <li className="flex gap-2"><Mail className="size-4 mt-0.5 text-accent shrink-0" aria-hidden /><a href={`mailto:${email}`} className="hover:text-accent">{email}</a></li>}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-muted">
          <p>© {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
          <p>
            Built by{' '}
            <a href="https://github.com/SwethaRanganathan0184" target="_blank" rel="noopener noreferrer" className="text-fg/80 hover:text-accent underline-offset-2 hover:underline">
              Swetha
            </a>{' '}
            and{' '}
            <a href="https://github.com/nh-44" target="_blank" rel="noopener noreferrer" className="text-fg/80 hover:text-accent underline-offset-2 hover:underline">
              Naveen
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
