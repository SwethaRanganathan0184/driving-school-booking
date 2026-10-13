'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { homeFor } from '@/lib/useAuthGate'
import AuthCard, { Divider, GoogleButton } from '../components/AuthCard'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { Alert } from '../components/ui/Feedback'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })

    if (loginError) {
      setLoading(false)
      setError(loginError.message)
      return
    }

    // Instructors created by an admin must replace their temporary password first.
    if (data.user.user_metadata?.must_change_password) {
      router.push('/reset-password?first=1')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      setLoading(false)
      setError('Logged in, but could not load your profile.')
      return
    }

    router.push(homeFor(profile.role))
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  return (
    <AuthCard title="Welcome back" subtitle="Students, instructors and admins all sign in here.">
      <GoogleButton onClick={handleGoogleLogin} />
      <Divider />
      <form onSubmit={handleLogin} className="space-y-4">
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="flex justify-end -mt-1">
          <Link href="/forgot-password" className="text-sm text-muted hover:text-accent transition-colors">
            Forgot password?
          </Link>
        </div>
        <Alert>{error}</Alert>
        <Button type="submit" size="lg" loading={loading} icon={LogIn} className="w-full">
          {loading ? 'Signing in' : 'Sign in'}
        </Button>
      </form>
      <p className="text-sm text-muted text-center mt-6">
        New here?{' '}
        <Link href="/signup" className="text-accent font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  )
}
