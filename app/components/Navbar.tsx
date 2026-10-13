'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquareQuote,
  Moon,
  Package,
  Search,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useMotionProfile } from '@/lib/motion'
import Logo from './Logo'
import ScrollRoad from './ScrollRoad'
import { useSiteTheme } from './ThemeProvider'
import Button from './ui/Button'

type Role = 'admin' | 'instructor' | 'customer'
type NavLink = { href: string; label: string; icon: React.ElementType }

const LINKS: Record<Role, NavLink[]> = {
  customer: [
    { href: '/customer', label: 'Find an instructor', icon: Search },
    { href: '/customer/packages', label: 'My lessons', icon: Package },
    { href: '/profile', label: 'Profile', icon: UserRound },
  ],
  instructor: [
    { href: '/instructor', label: 'Schedule', icon: CalendarDays },
    { href: '/instructor/bookings', label: 'Appointments', icon: ClipboardList },
    { href: '/instructor/feedback', label: 'Feedback', icon: MessageSquareQuote },
    { href: '/profile', label: 'Profile', icon: UserRound },
  ],
  admin: [
    { href: '/admin', label: 'Admin', icon: LayoutDashboard },
    { href: '/profile', label: 'Profile', icon: UserRound },
  ],
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const m = useMotionProfile()
  const { isLight, toggleLight } = useSiteTheme()
  const [role, setRole] = useState<Role | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const loadRole = async (userId: string) => {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
      setRole((profile?.role as Role) ?? 'customer')
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

  const links = loggedIn && role ? LINKS[role] : []
  // The longest link that prefixes the current path wins, so /customer/instructor/x highlights "Find an instructor".
  const activeHref = links
    .map((l) => l.href)
    .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
    .sort((a, b) => b.length - a.length)[0]
  const isActive = (href: string) => href === activeHref

  const ThemeIcon = isLight ? Moon : Sun

  return (
    <header className="sticky top-0 z-40 bg-bg/75 backdrop-blur-xl border-b border-border">
      <nav className="relative max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4" aria-label="Main">
        <Logo />

        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center gap-2 px-3 py-2 text-sm rounded-[var(--radius)] transition-colors ${
                  active ? 'text-fg' : 'text-muted hover:text-fg'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 bg-surface-2 border border-border rounded-[var(--radius)]"
                    transition={m.enabled ? m.spring : { duration: 0 }}
                  />
                )}
                <Icon className="relative size-4" aria-hidden />
                <span className="relative">{label}</span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={toggleLight}
            className="ml-1 p-2 rounded-[var(--radius)] text-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            <ThemeIcon className="size-4" />
          </button>

          {loggedIn ? (
            <Button variant="ghost" size="sm" icon={LogOut} onClick={handleLogout}>
              Log out
            </Button>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Button variant="ghost" size="sm" href="/login" icon={LogIn}>
                Log in
              </Button>
              <Button size="sm" href="/signup">
                Get started
              </Button>
            </div>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
          <button
            type="button"
            onClick={toggleLight}
            className="p-2 text-muted hover:text-fg cursor-pointer"
            aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            <ThemeIcon className="size-5" />
          </button>
          <button
            type="button"
            className="p-2 text-fg cursor-pointer"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        <ScrollRoad />
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={m.enabled ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={m.enabled ? { height: 0, opacity: 0 } : undefined}
            transition={{ duration: m.duration(0.25) }}
            className="md:hidden overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {links.map(({ href, label, icon: Icon }, i) => (
                <motion.div
                  key={href}
                  initial={m.enabled ? { opacity: 0, x: -12 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: m.duration(0.04 * i) }}
                >
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] ${
                      isActive(href) ? 'bg-surface-2 text-fg' : 'text-muted'
                    }`}
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </Link>
                </motion.div>
              ))}
              {loggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 text-muted text-left cursor-pointer"
                >
                  <LogOut className="size-4" aria-hidden />
                  Log out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button variant="secondary" href="/login" onClick={() => setMenuOpen(false)}>
                    Log in
                  </Button>
                  <Button href="/signup" onClick={() => setMenuOpen(false)}>
                    Get started
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
