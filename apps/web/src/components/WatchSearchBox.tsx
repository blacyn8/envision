'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface WatchSearchBoxProps {
  initialQuery?: string
}

/**
 * WatchSearchBox — the search-first input on the /watch page.
 * Submits via URL query param (?q=...) so results are shareable
 * and the page works without JavaScript (progressive enhancement).
 */
export function WatchSearchBox({ initialQuery = '' }: WatchSearchBoxProps) {
  const [value, setValue] = useState(initialQuery)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    router.push(`/watch?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="mx-auto w-full max-w-[640px]">
      <div className="flex items-center gap-2 rounded-full border border-fa-line bg-fa-surface px-4 py-2.5 transition-colors focus-within:border-fa-accent focus-within:shadow-[0_0_0_3px_rgba(79,209,255,0.15)]">
        <Search size={18} className="flex-shrink-0 text-fa-text-dim" />
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search a movie, series, or anime title…"
          aria-label="Search titles"
          autoFocus
          className="w-full bg-transparent text-sm text-fa-text outline-none placeholder:text-fa-text-dim"
        />
        <button
          type="submit"
          className="flex-shrink-0 rounded-full bg-fa-accent px-4 py-1.5 text-xs font-bold text-fa-bg shadow-glow transition-all hover:shadow-glow-lg"
        >
          Search
        </button>
      </div>
    </form>
  )
}
