// ─── String utilities ─────────────────────────────────────────────────────────

/**
 * Converts a movie title to a URL-safe slug.
 * e.g. "Blood & Clay (2025)" → "blood-and-clay-2025"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Truncates text to a given character limit and adds ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

// ─── Movie / poster helpers ───────────────────────────────────────────────────

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

/**
 * Builds a full TMDB poster URL from a poster_path string.
 * size: 'w185' | 'w342' | 'w500' | 'w780' | 'original'
 */
export function buildPosterUrl(
  posterPath: string | null | undefined,
  size: 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'
): string | null {
  if (!posterPath) return null
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`
}

/**
 * Formats a runtime in minutes to a human-readable string.
 * e.g. 142 → "2h 22m"
 */
export function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes) return 'N/A'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Rounds a rating to one decimal place for display.
 * e.g. 7.654 → "7.7"
 */
export function formatRating(rating: number | null | undefined): string {
  if (rating == null) return 'N/A'
  return rating.toFixed(1)
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a relative time string.
 * e.g. "2 days ago", "just now"
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Class name helper ────────────────────────────────────────────────────────

/**
 * Merges class names, filtering out falsy values.
 * Use this instead of importing clsx in shared package (no dep needed).
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ─── Region display helpers ───────────────────────────────────────────────────

export const REGION_LABELS: Record<string, string> = {
  hollywood: 'Hollywood',
  nollywood: 'Nollywood',
  kdrama: 'KDrama',
  bollywood: 'Bollywood',
  anime: 'Anime',
  african: 'African TV',
}

export const REGION_FLAGS: Record<string, string> = {
  hollywood: '🎬',
  nollywood: '🇳🇬',
  kdrama: '🇰🇷',
  bollywood: '🇮🇳',
  anime: '🎌',
  african: '🌍',
}

export function getRegionLabel(region: string): string {
  return REGION_LABELS[region] ?? region
}

export function getRegionFlag(region: string): string {
  return REGION_FLAGS[region] ?? '🎬'
}
