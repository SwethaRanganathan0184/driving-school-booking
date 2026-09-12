'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import LogoMark from '../components/LogoMark'

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
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#F7F8FA] px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="flex justify-center mb-5">
          <LogoMark className="w-10 h-10 text-[#16213E]" />
        </div>
        <h1 className="text-2xl font-[family-name:var(--font-manrope)] font-semibold text-[#16213E] text-center mb-8">
          Reset your password
        </h1>

        {sent ? (
          <p className="text-sm text-[#16213E] text-center">
            If an account exists for that email, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && <p className="text-sm text-[#B3261E]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#B8912F] text-[#16213E] font-medium py-2.5 hover:bg-[#A57F27] transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-[#47526B]">
          <Link href="/login" className="text-[#16213E] font-medium hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  )
}