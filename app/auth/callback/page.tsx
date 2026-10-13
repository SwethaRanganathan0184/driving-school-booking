'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { homeFor } from '@/lib/useAuthGate'
import { PageLoading } from '../../components/ui/Page'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        router.push('/login')
        return
      }

      // Same role lookup as the login page. Google users get a profile row
      // auto-created by the signup trigger, defaulting to 'customer'.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single()

      if (profileError || !profile) {
        router.push('/login')
        return
      }

      router.push(homeFor(profile.role))
    }

    handleRedirect()
  }, [router])

  return <PageLoading label="Signing you in" />
}
