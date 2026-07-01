'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        // Supabase sends a confirmation email — user clicks it to activate
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fa-bg px-4">
        <div className="w-full max-w-[400px] rounded-2xl border border-fa-line bg-fa-surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-fa-accent/20 bg-fa-accent/10 text-fa-accent text-2xl">
            ✓
          </div>
          <h2 className="mb-2 font-display text-xl font-extrabold">Check your email</h2>
          <p className="text-sm text-fa-text-dim">
            We sent a confirmation link to <strong className="text-fa-text">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-fa-accent px-6 py-3 text-sm font-bold text-fa-bg shadow-glow"
          >
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-fa-bg px-4">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-fa-accent to-fa-accent-2 font-display text-[15px] font-extrabold text-fa-bg shadow-glow">
            FA
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            Flix<em className="not-italic text-fa-accent">Aura</em>
          </span>
        </Link>

        <div className="rounded-2xl border border-fa-line bg-fa-surface p-8">
          <h1 className="mb-1 font-display text-2xl font-extrabold">Create account</h1>
          <p className="mb-6 text-sm text-fa-text-dim">Free forever. No credit card needed.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold" htmlFor="name">
                Display name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full rounded-xl border border-fa-line bg-fa-bg px-4 py-3 text-sm text-fa-text outline-none placeholder:text-fa-text-dim focus:border-fa-accent focus:shadow-[0_0_0_3px_rgba(79,209,255,0.15)]"
              />
            </div>

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
                  minLength={8}
                  placeholder="Min 8 characters"
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
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-fa-text-dim">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-fa-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
