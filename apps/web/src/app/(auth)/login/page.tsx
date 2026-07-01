'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/**
 * Login page
 *
 * Supports a `next` query param so users return to the page
 * they were trying to visit after signing in.
 * e.g. /login?next=/watchlist → after login → /watchlist
 */
export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('next') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(nextUrl)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-fa-bg px-4">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-fa-accent to-fa-accent-2 font-display text-[15px] font-extrabold text-fa-bg shadow-glow">
            FA
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            Flix<em className="not-italic text-fa-accent">Aura</em>
          </span>
        </Link>

        <div className="rounded-2xl border border-fa-line bg-fa-surface p-8">
          <h1 className="mb-1 font-display text-2xl font-extrabold">Welcome back</h1>
          <p className="mb-6 text-sm text-fa-text-dim">Sign in to your FlixAura account</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-fa-line bg-fa-bg px-4 py-3 text-sm text-fa-text outline-none placeholder:text-fa-text-dim focus:border-fa-accent focus:shadow-[0_0_0_3px_rgba(79,209,255,0.15)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-fa-line bg-fa-bg px-4 py-3 pr-11 text-sm text-fa-text outline-none placeholder:text-fa-text-dim focus:border-fa-accent focus:shadow-[0_0_0_3px_rgba(79,209,255,0.15)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fa-text-dim hover:text-fa-text"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-fa-accent py-3 text-sm font-bold text-fa-bg shadow-glow transition-all hover:shadow-glow-lg disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-fa-text-dim">
            No account?{' '}
            <Link href="/signup" className="font-semibold text-fa-accent hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
