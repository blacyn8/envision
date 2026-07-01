/**
 * ui.ts — Frontend-only TypeScript types
 *
 * These types are specific to the web UI layer.
 * Shared domain types (Movie, User, ExternalLink etc.) live in @flixaura/shared.
 * This file covers: form states, UI component variants, page search params.
 */

// ─── Page search params ───────────────────────────────────────────────────────

/** Search params for the /watch page */
export interface WatchPageParams {
  q?: string
}

/** Search params for the /browse page */
export interface BrowsePageParams {
  region?: string
  genre?: string
  year?: string
  quality?: string
  page?: string
}

// ─── UI State types ───────────────────────────────────────────────────────────

/** Generic async data state — loading, success, error */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

/** Toast notification */
export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

// ─── Component variant types ──────────────────────────────────────────────────

/** Shelf display variants — matches MovieShelf variant prop */
export type ShelfVariant = 'default' | 'primary' | 'anime'

/** Button variants used across the app */
export type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'danger'

/** Badge colour variants */
export type BadgeVariant = 'cyan' | 'amber' | 'violet' | 'green' | 'dim'

// ─── Form types ───────────────────────────────────────────────────────────────

export interface LoginFormValues {
  email: string
  password: string
}

export interface SignupFormValues {
  email: string
  password: string
  displayName: string
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavLink {
  href: string
  label: string
  isExternal?: boolean
}
