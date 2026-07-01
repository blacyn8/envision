/**
 * useWatchlistStore.ts — client-side watchlist state
 *
 * Keeps the watchlist in memory so toggling the bookmark icon
 * is instant (optimistic UI) without waiting for a Supabase round-trip.
 *
 * On first mount, the list is populated from the server (via a fetch call
 * in the component or page that needs it). After that, all add/remove
 * operations update this store AND fire the API in the background.
 *
 * Usage:
 *   const { ids, toggle, has } = useWatchlistStore()
 */

import { create } from 'zustand'

interface WatchlistState {
  /** Set of movie IDs currently in the user's watchlist */
  ids: Set<string>

  /** Replace the entire set — called on initial load */
  setIds: (movieIds: string[]) => void

  /** Add a movie to the local store */
  add: (movieId: string) => void

  /** Remove a movie from the local store */
  remove: (movieId: string) => void

  /** Toggle — add if absent, remove if present. Returns new state. */
  toggle: (movieId: string) => boolean

  /** Check if a movie is in the watchlist */
  has: (movieId: string) => boolean
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  ids: new Set(),

  setIds: (movieIds) =>
    set({ ids: new Set(movieIds) }),

  add: (movieId) =>
    set((state) => ({ ids: new Set([...state.ids, movieId]) })),

  remove: (movieId) =>
    set((state) => {
      const next = new Set(state.ids)
      next.delete(movieId)
      return { ids: next }
    }),

  toggle: (movieId) => {
    const inList = get().ids.has(movieId)
    if (inList) {
      get().remove(movieId)
    } else {
      get().add(movieId)
    }
    return !inList
  },

  has: (movieId) => get().ids.has(movieId),
}))
