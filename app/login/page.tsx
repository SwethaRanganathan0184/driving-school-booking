'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import LogoMark from '../components/LogoMark'

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

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setLoading(false)
      setError(loginError.message)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    setLoading(false)

    if (profileError || !profile) {
      setError('Logged in, but could not load your profile.')
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
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#F7F8FA] px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="flex justify-center mb-5">
          <LogoMark className="w-10 h-10 text-[#16213E]" />
        </div>
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] text-center">
          Welcome back
        </h1>
        <p className="text-sm text-[#47526B] text-center mt-1 mb-8">Log in to your account.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#16213E] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-[#16213E]">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-[#16213E] hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E]"
            />
          </div>

          {error && <p className="text-sm text-[#B3261E]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#B8912F] text-[#16213E] font-medium py-2.5 hover:bg-[#A57F27] transition-colors disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 py-2.5 text-[#16213E] font-medium hover:bg-gray-50 transition-colors"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-[#47526B]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#16213E] font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}