'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { homeFor } from '@/lib/useAuthGate'
import AuthCard from '../components/AuthCard'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { Alert } from '../components/ui/Feedback'
import { PageLoading } from '../components/ui/Page'

function ResetPasswordForm() {
  const router = useRouter()
  const firstLogin = useSearchParams().get('first') === '1'
  const [ready, setReady] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)

    const { data, error: updateError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    })

    if (updateError || !data.user) {
      setLoading(false)
      setError(updateError?.message ?? 'Could not update your password.')
      return
    }

    setDone(true)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    setTimeout(() => router.push(homeFor(profile?.role)), 1500)
  }

  if (ready === null) return <PageLoading />

  if (!ready) {
    return (
      <AuthCard title="Link expired" subtitle="This reset link is invalid or has expired.">
        <Button href="/forgot-password" className="w-full">
          Request a new link
        </Button>
      </AuthCard>
    )
  }

  if (done) {
    return (
      <AuthCard title="Password updated">
        <div className="text-center">
          <CheckCircle2 className="size-12 text-success mx-auto mb-4" aria-hidden />
          <p className="text-sm text-muted">Taking you to your dashboard…</p>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title={firstLogin ? 'Choose your password' : 'Set a new password'}
      subtitle={firstLogin ? 'Welcome aboard! Replace the temporary password you were given.' : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="New password" type="password" autoComplete="new-password" minLength={8} hint="At least 8 characters." value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Input label="Confirm password" type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <Alert>{error}</Alert>
        <Button type="submit" size="lg" loading={loading} icon={KeyRound} className="w-full">
          Save password
        </Button>
      </form>
      {!firstLogin && (
        <p className="text-sm text-muted text-center mt-6">
          <Link href="/login" className="text-accent font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      )}
    </AuthCard>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
