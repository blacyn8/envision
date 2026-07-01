/**
 * useSearchStore.ts — global search state
 *
 * Persists the last search query so navigating between pages
 * (e.g. from /watch back to home and back to /watch) restores
 * the user's last search without a re-fetch.
 *
 * Usage:
 *   const { query, setQuery, mode, setMode } = useSearchStore()
 */

import { create } from 'zustand'

type SearchMode = 'keyword' | 'ai'

interface SearchState {
  /** Current search query string */
  query: string

  /** 'keyword' = standard text search, 'ai' = Claude natural language */
  mode: SearchMode

  /** Whether a search is in flight */
  isSearching: boolean

  setQuery: (q: string) => void
  setMode: (m: SearchMode) => void
  setSearching: (v: boolean) => void
  clear: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  mode: 'keyword',
  isSearching: false,

  setQuery: (query) => set({ query }),
  setMode: (mode) => set({ mode }),
  setSearching: (isSearching) => set({ isSearching }),
  clear: () => set({ query: '', isSearching: false }),
}))
