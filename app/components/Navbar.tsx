'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoMark from './LogoMark'

export default function Navbar() {
  const router = useRouter()
  const [role, setRole] = useState<'admin' | 'instructor' | 'customer' | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const loadRole = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      setRole((profile?.role as typeof role) ?? 'customer')
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setLoggedIn(true)
        loadRole(data.session.user.id)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setLoggedIn(true)
        loadRole(session.user.id)
      } else {
        setLoggedIn(false)
        setRole(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/login')
  }

  const links = !loggedIn
    ? [
        { href: '/login', label: 'Log in' },
        { href: '/signup', label: 'Sign up' },
      ]
    : role === 'instructor'
    ? [
        { href: '/instructor', label: 'Availability' },
        { href: '/instructor/bookings', label: 'Bookings' },
        { href: '/profile', label: 'Profile' },
      ]
    : role === 'admin'
    ? [
        { href: '/admin', label: 'Admin' },
        { href: '/profile', label: 'Profile' },
      ]
    : [
        { href: '/customer', label: 'Find an instructor' },
        { href: '/customer/packages', label: 'My packages' },
        { href: '/profile', label: 'Profile' },
      ]

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="w-7 h-7 text-[#16213E]" />
          <span className="text-[#16213E] font-[family-name:var(--font-manrope)] font-semibold tracking-tight">
            DriveWise
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-gray-600 hover:text-[#16213E] text-sm">
              {link.label}
            </Link>
          ))}
          {loggedIn && (
            <button onClick={handleLogout} className="text-gray-600 hover:text-[#16213E] text-sm">
              Log out
            </button>
          )}
        </div>

        <button
          className="sm:hidden text-[#16213E]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden mt-3 flex flex-col gap-3 pb-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-600 hover:text-[#16213E] text-sm"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {loggedIn && (
            <button
              onClick={handleLogout}
              className="text-left text-gray-600 hover:text-[#16213E] text-sm"
            >
              Log out
            </button>
          )}
        </div>
      )}
    </nav>
  )
}