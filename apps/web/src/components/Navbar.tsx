'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, User, Bookmark } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/browse', label: 'Browse' },
  { href: '/watch', label: 'Watch' },
]

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/watch?q=${encodeURIComponent(trimmed)}`)
    setSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-fa-line bg-fa-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-4 py-4 sm:px-8">
        {/* Logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-fa-accent to-fa-accent-2 font-display text-[15px] font-extrabold text-fa-bg shadow-glow">
            FA
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            Flix<em className="font-extrabold not-italic text-fa-accent">Aura</em>
          </span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden flex-1 justify-center gap-7 md:flex">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className={`relative py-2 text-sm font-semibold transition-colors ${
                i === 0
                  ? 'text-fa-text after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:rounded after:bg-fa-accent after:shadow-glow'
                  : 'text-fa-text-dim hover:text-fa-text'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Search + Auth actions */}
        <div className="relative flex items-center gap-2">
          {/* Search toggle */}
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-fa-line bg-fa-surface text-fa-text-dim transition-all hover:border-fa-accent hover:text-fa-accent hover:shadow-[0_0_16px_rgba(79,209,255,0.25)]"
          >
            <Search size={20} strokeWidth={2} />
          </button>

          {/* Watchlist shortcut */}
          <Link
            href="/watchlist"
            aria-label="My watchlist"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-fa-line bg-fa-surface text-fa-text-dim transition-all hover:border-fa-accent hover:text-fa-accent"
          >
            <Bookmark size={18} />
          </Link>

          {/* Profile / Login */}
          {user ? (
            <Link
              href="/profile"
              aria-label="My profile"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-fa-accent/30 bg-fa-accent/10 text-fa-accent transition-all hover:bg-fa-accent/20"
            >
              <User size={18} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-fa-accent bg-fa-accent/10 px-4 py-1.5 text-xs font-bold text-fa-accent transition-all hover:bg-fa-accent hover:text-fa-bg"
            >
              Sign in
            </Link>
          )}

          {/* Search dropdown */}
          {searchOpen && (
            <form
              role="search"
              onSubmit={handleSearch}
              className="absolute right-0 top-12 w-[280px] animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <input
                type="search"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles, actors, genres…"
                aria-label="Search"
                autoFocus
                className="w-full rounded-xl border border-fa-line bg-fa-surface px-3.5 py-2.5 text-sm text-fa-text outline-none placeholder:text-fa-text-dim focus:border-fa-accent focus:shadow-[0_0_0_3px_rgba(79,209,255,0.15)]"
              />
            </form>
          )}
        </div>
      </div>
    </header>
  )
}

