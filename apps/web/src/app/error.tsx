'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * error.tsx — Global error boundary.
 *
 * Next.js renders this page when an unhandled error occurs in any route.
 * Must be a client component (Next.js requirement for error boundaries).
 *
 * In production, the `error` prop's message is sanitised by Next.js
 * and won't expose internals — safe to display.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console in development — swap for Sentry in production
    console.error('[FlixAura error]', error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-fa-bg px-4 font-sans text-fa-text">
        <div className="w-full max-w-[420px] text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <AlertTriangle size={28} className="text-red-400" />
          </div>

          <h1 className="font-display text-2xl font-extrabold">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-fa-text-dim">
            An unexpected error occurred. Our team has been notified.
            {error.digest && (
              <span className="mt-1 block font-mono text-xs text-fa-text-dim/60">
                Error ID: {error.digest}
              </span>
            )}
          </p>

          <div className="mt-7 flex justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center rounded-full bg-fa-accent px-6 py-2.5 text-sm font-bold text-fa-bg shadow-glow transition-all hover:shadow-glow-lg"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center rounded-full border border-fa-line px-6 py-2.5 text-sm font-semibold text-fa-text-dim transition-colors hover:border-fa-accent hover:text-fa-accent"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
