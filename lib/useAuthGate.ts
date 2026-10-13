'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export type Role = 'admin' | 'instructor' | 'customer'

type Gate =
  | { status: 'loading' }
  | { status: 'denied'; message: string }
  | { status: 'ready'; session: Session; role: Role; userId: string }

/**
 * Redirects to /login when signed out. When `allow` is given, shows a "no access" state for other roles.
 */
export function useAuthGate(allow?: Role[]): Gate {
  const router = useRouter()
  const [gate, setGate] = useState<Gate>({ status: 'loading' })
  const allowKey = allow?.join(',') ?? ''

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace('/login')
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.session.user.id).single()
      const role = ((profile?.role as Role) ?? 'customer') as Role
      if (cancelled) return
      const allowed = allowKey ? allowKey.split(',') : null
      if (allowed && !allowed.includes(role)) {
        setGate({ status: 'denied', message: "This page isn't available for your account." })
        return
      }
      setGate({ status: 'ready', session: data.session, role, userId: data.session.user.id })
    }
    check()
    return () => {
      cancelled = true
    }
  }, [router, allowKey])

  return gate
}

/** Where each role lands after signing in. */
export function homeFor(role: string | null | undefined) {
  return role === 'admin' ? '/admin' : role === 'instructor' ? '/instructor' : '/customer'
}

/** Only allow same-site relative redirects (blocks ?redirect=https://evil.example). */
export function safeRedirect(target: string | null, fallback: string) {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : fallback
}
