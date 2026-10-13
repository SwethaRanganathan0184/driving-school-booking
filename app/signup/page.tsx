'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MailCheck, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import AuthCard, { Divider, GoogleButton } from '../components/AuthCard'
import Button from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { Alert } from '../components/ui/Feedback'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
          gender: gender || null,
        },
      },
    })

    setLoading(false)

    if (signupError) {
      setError(signupError.message)
      return
    }

    // With email confirmation disabled Supabase signs the user straight in.
    if (data.session) {
      router.push('/customer')
      return
    }
    setDone(true)
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

  if (done) {
    return (
      <AuthCard title="Check your inbox" subtitle={`We sent a confirmation link to ${email}.`}>
        <div className="text-center">
          <MailCheck className="size-12 text-accent mx-auto mb-4" aria-hidden />
          <p className="text-muted text-sm mb-6">Confirm your email, then sign in to book your first lesson.</p>
          <Button href="/login" className="w-full">
            Go to sign in
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Create your account" subtitle="Book lessons in minutes. Pay only after each class.">
      <GoogleButton onClick={handleGoogleLogin} label="Sign up with Google" />
      <Divider />
      <form onSubmit={handleSignup} className="space-y-4">
        <Input label="Full name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Phone number" type="tel" autoComplete="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
          <Field label="Gender">
            {(p) => (
              <select {...p} value={gender} onChange={(e) => setGender(e.target.value)} required>
                <option value="" disabled>
                  Select…
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="transgender">Transgender</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            )}
          </Field>
        </div>
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          hint="At least 8 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Alert>{error}</Alert>
        <Button type="submit" size="lg" loading={loading} icon={UserPlus} className="w-full">
          {loading ? 'Creating account' : 'Create account'}
        </Button>
      </form>
      <p className="text-sm text-muted text-center mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-accent font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
