'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import LogoMark from '../components/LogoMark'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
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

    router.push('/login')
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
          Create your account
        </h1>
        <p className="text-sm text-[#47526B] text-center mt-1 mb-8">
          Start booking lessons in a couple of minutes.
        </p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-[#16213E] mb-1">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E]"
            />
          </div>
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
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-[#16213E] mb-1">
              Phone number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E]"
            />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-[#16213E] mb-1">
              Gender
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E] bg-white"
            >
              <option value="" disabled>
                Select...
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="transgender">Transgender</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#16213E] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[#16213E] focus:outline-none focus:ring-2 focus:ring-[#B8912F] focus:border-[#16213E]"
            />
          </div>

          {error && <p className="text-sm text-[#B3261E]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#B8912F] text-[#16213E] font-medium py-2.5 hover:bg-[#A57F27] transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
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
        <p className="text-xs text-[#47526B] text-center mt-2">
          With Google, you can add your phone number and gender afterward from your profile.
        </p>

        <p className="mt-6 text-center text-sm text-[#47526B]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#16213E] font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}