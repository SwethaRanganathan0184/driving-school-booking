'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        router.push('/login')
        return
      }

      const userId = data.session.user.id

      // Same role lookup as the login page — Google users get a profile row
      // auto-created by the same trigger, defaulting to 'customer'.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        router.push('/login')
        return
      }

      if (profile.role === 'admin') {
        router.push('/admin')
      } else if (profile.role === 'instructor') {
        router.push('/instructor')
      } else {
        router.push('/customer')
      }
    }

    handleRedirect()
  }, [router])

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <p>Signing you in...</p>
    </div>
  )
}
