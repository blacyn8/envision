'use client'

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useWatchlistStore } from '@/store/useWatchlistStore'
import { useAuth } from '@/contexts/AuthContext'

interface WatchlistButtonProps {
  movieId: string
  /** 'block' (default) fills its container; 'pill' is a compact inline button for hero/card overlays */
  variant?: 'block' | 'pill'
}

/**
 * WatchlistButton — toggles a movie in/out of the user's watchlist.
 *
 * Behaviour:
 * - Optimistic UI: the icon updates instantly.
 * - A POST/DELETE request fires in the background to sync with Supabase.
 * - If the user is not logged in, clicking redirects to /login.
 */
export function WatchlistButton({ movieId, variant = 'block' }: WatchlistButtonProps) {
  const { user } = useAuth()
  const { has, toggle } = useWatchlistStore()
  const [loading, setLoading] = useState(false)
  const inList = has(movieId)

  // Sync initial watchlist state from API on mount (if logged in)
  useEffect(() => {
    if (!user) return
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.movieIds)) {
          useWatchlistStore.getState().setIds(data.movieIds)
        }
      })
      .catch(() => {})
  }, [user])

  async function handleClick() {
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
      return
    }

    // Optimistic toggle
    const nowInList = toggle(movieId)
    setLoading(true)

    try {
      await fetch('/api/watchlist', {
        method: nowInList ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId }),
      })
    } catch {
      // Revert optimistic update on failure
      toggle(movieId)
    } finally {
      setLoading(false)
    }
  }

  const blockClasses = `flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all ${
    inList
      ? 'border-fa-accent bg-fa-accent/10 text-fa-accent'
      : 'border-fa-line bg-fa-surface text-fa-text-dim hover:border-fa-accent hover:text-fa-accent'
  }`

  const pillClasses = `inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-bold backdrop-blur-md transition-colors ${
    inList
      ? 'border-fa-accent bg-fa-accent/10 text-fa-accent'
      : 'border-fa-line bg-white/5 text-fa-text hover:border-fa-accent hover:text-fa-accent'
  }`

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={inList ? 'Remove from watchlist' : 'Add to watchlist'}
      className={`${variant === 'pill' ? pillClasses : blockClasses} ${loading ? 'opacity-50' : ''}`}
    >
      {inList ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
      {inList ? 'In watchlist' : '+ Watchlist'}
    </button>
  )
}
