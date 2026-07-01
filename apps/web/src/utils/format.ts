/**
 * format.ts — UI-specific formatters
 *
 * These are frontend-only helpers. Shared formatters (ratings, runtime,
 * region labels) live in @flixaura/shared. This file covers things
 * only the web UI needs: human-readable dates, file sizes, view counts.
 */

/**
 * Format a date string to a human-readable relative date.
 * e.g. "2 days ago", "just now", "3 months ago"
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`
  return `${Math.floor(seconds / 31536000)}y ago`
}

/**
 * Format a file size in MB to a readable string.
 * e.g. 1450 → "1.4 GB", 850 → "850 MB"
 */
export function formatFileSize(mb: number | null | undefined): string {
  if (!mb) return 'Unknown size'
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${Math.round(mb)} MB`
}

/**
 * Format a number into a compact count string.
 * e.g. 1234 → "1.2K", 1500000 → "1.5M"
 */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/**
 * Format a calendar date to a display string.
 * e.g. "June 13, 2026"
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Truncate a string to a max length, appending ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}
