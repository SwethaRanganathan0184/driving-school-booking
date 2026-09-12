'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import LogoMark from '../components/LogoMark'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#F7F8FA] px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="flex justify-center mb-5">
          <LogoMark className="w-10 h-10 text-[#16213E]" />
        </div>
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] text-center mb-8">
          Set a new password
        </h1>

        {!ready ? (
          <p className="text-sm text-[#B3261E] text-center">
            This link is invalid or has expired. Request a new one from the login page.
          </p>
        ) : done ? (
          <p className="text-sm text-[#16213E] text-center">Password updated. Redirecting to log in…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#16213E] mb-1">
                New password
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
              {loading ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}