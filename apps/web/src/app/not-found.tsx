import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Film } from 'lucide-react'

/**
 * not-found.tsx — Custom 404 page.
 * Shown when a movie slug, route, or page doesn't exist.
 * Keeps the FlixAura shell (Navbar + Footer) so the user
 * always has a way back without using the browser's back button.
 */
export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-fa-line bg-fa-surface">
          <Film size={36} className="text-fa-text-dim" />
        </div>

        <h1 className="font-display text-5xl font-extrabold tracking-tight text-fa-accent">
          404
        </h1>
        <p className="mt-2 font-display text-xl font-bold">Page not found</p>
        <p className="mt-2 max-w-[360px] text-sm leading-relaxed text-fa-text-dim">
          The movie, series, or page you're looking for doesn't exist or has been removed.
        </p>

        <div className="mt-8 flex gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-fa-accent px-6 py-2.5 text-sm font-bold text-fa-bg shadow-glow transition-all hover:shadow-glow-lg"
          >
            Go home
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center rounded-full border border-fa-line px-6 py-2.5 text-sm font-semibold text-fa-text-dim transition-colors hover:border-fa-accent hover:text-fa-accent"
          >
            Browse movies
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
