'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MailCheck, Send } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import AuthCard from '../components/AuthCard'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { Alert } from '../components/ui/Feedback'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  return (
    <AuthCard title="Reset your password" subtitle={sent ? undefined : "Enter your email and we'll send you a reset link."}>
      {sent ? (
        <div className="text-center">
          <MailCheck className="size-12 text-accent mx-auto mb-4" aria-hidden />
          <p className="text-sm text-muted">If an account exists for that email, a reset link is on its way. Check your inbox.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Alert>{error}</Alert>
          <Button type="submit" size="lg" loading={loading} icon={Send} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
      <p className="text-sm text-muted text-center mt-6">
        <Link href="/login" className="text-accent font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  )
}
