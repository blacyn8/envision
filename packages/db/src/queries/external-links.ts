/**
 * external-links.ts — Queries for the Phase A content pipeline tables:
 * external_links, scraper_log, youtube_embeds.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ExternalLink,
  ScraperLog,
  ScraperStatus,
  YoutubeEmbed,
  LinkType,
} from '@flixaura/shared'

// ─── EXTERNAL LINKS ────────────────────────────────────────────────────────────

/**
 * Get all active external links for a movie, ordered by click_count
 * (most-clicked / most-trusted links shown first).
 */
export async function getExternalLinksForMovie(
  client: SupabaseClient,
  movieId: string
): Promise<ExternalLink[]> {
  const { data, error } = await client
    .from('external_links')
    .select('*')
    .eq('movie_id', movieId)
    .eq('is_active', true)
    .order('click_count', { ascending: false })

  if (error) throw new Error(`getExternalLinksForMovie failed: ${error.message}`)

  return (data ?? []) as ExternalLink[]
}

/**
 * Insert or update an external link.
 * Uses (movie_id, url) as the conflict key — re-running the scraper
 * on the same movie won't create duplicates.
 */
export async function upsertExternalLink(
  client: SupabaseClient,
  link: {
    movie_id: string
    provider_name: string
    link_type: LinkType
    url: string
    quality?: string | null
  }
): Promise<void> {
  const { error } = await client
    .from('external_links')
    .upsert(
      {
        ...link,
        quality: link.quality ?? null,
        is_active: true,
        last_checked: new Date().toISOString(),
      },
      { onConflict: 'movie_id,url' }
    )

  if (error) throw new Error(`upsertExternalLink failed: ${error.message}`)
}

/**
 * Mark a link as dead (failed health check).
 * Inactive links are hidden from users but kept for history.
 */
export async function deactivateExternalLink(
  client: SupabaseClient,
  linkId: string
): Promise<void> {
  const { error } = await client
    .from('external_links')
    .update({ is_active: false, last_checked: new Date().toISOString() })
    .eq('id', linkId)

  if (error) throw new Error(`deactivateExternalLink failed: ${error.message}`)
}

/**
 * Increment the click counter on a link.
 * Called when a user clicks "Watch" or "Download" — used for ranking.
 */
export async function incrementLinkClickCount(
  client: SupabaseClient,
  linkId: string
): Promise<void> {
  const { error } = await client.rpc('increment_link_click_count', {
    link_id: linkId,
  })

  // Fallback if the RPC function doesn't exist yet — non-fatal
  if (error) {
    console.warn(`incrementLinkClickCount RPC failed (non-fatal): ${error.message}`)
  }
}

/**
 * Get all external links that haven't been health-checked recently.
 * Used by a periodic link-checker job.
 */
export async function getStaleExternalLinks(
  client: SupabaseClient,
  olderThanHours = 72,
  limit = 100
): Promise<ExternalLink[]> {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString()

  const { data, error } = await client
    .from('external_links')
    .select('*')
    .eq('is_active', true)
    .or(`last_checked.is.null,last_checked.lt.${cutoff}`)
    .limit(limit)

  if (error) throw new Error(`getStaleExternalLinks failed: ${error.message}`)

  return (data ?? []) as ExternalLink[]
}

// ─── SCRAPER LOG ──────────────────────────────────────────────────────────────

/**
 * Start a new scraper run — inserts a 'running' row and returns its ID.
 * Call finishScraperRun() when done to update status and counts.
 */
export async function startScraperRun(
  client: SupabaseClient,
  sourceName: string
): Promise<string> {
  const { data, error } = await client
    .from('scraper_log')
    .insert({ source_name: sourceName, status: 'running' })
    .select('id')
    .single()

  if (error) throw new Error(`startScraperRun failed: ${error.message}`)

  return data.id as string
}

/**
 * Finish a scraper run — updates the log row with final counts and status.
 */
export async function finishScraperRun(
  client: SupabaseClient,
  logId: string,
  result: {
    items_found: number
    items_added: number
    items_updated: number
    items_failed: number
    status: ScraperStatus
    error_message?: string
  }
): Promise<void> {
  const { error } = await client
    .from('scraper_log')
    .update({
      ...result,
      finished_at: new Date().toISOString(),
    })
    .eq('id', logId)

  if (error) throw new Error(`finishScraperRun failed: ${error.message}`)
}

/**
 * Get the most recent scraper runs — used for an admin dashboard.
 */
export async function getRecentScraperLogs(
  client: SupabaseClient,
  limit = 20
): Promise<ScraperLog[]> {
  const { data, error } = await client
    .from('scraper_log')
    .select('*')
    .order('run_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getRecentScraperLogs failed: ${error.message}`)

  return (data ?? []) as ScraperLog[]
}

// ─── YOUTUBE EMBEDS ───────────────────────────────────────────────────────────

/**
 * Get all YouTube embeds for a movie (trailers + Phase B full content).
 */
export async function getYoutubeEmbedsForMovie(
  client: SupabaseClient,
  movieId: string
): Promise<YoutubeEmbed[]> {
  const { data, error } = await client
    .from('youtube_embeds')
    .select('*')
    .eq('movie_id', movieId)

  if (error) throw new Error(`getYoutubeEmbedsForMovie failed: ${error.message}`)

  return (data ?? []) as YoutubeEmbed[]
}

/**
 * Insert or update a YouTube embed (e.g. official trailer found via TMDB).
 */
export async function upsertYoutubeEmbed(
  client: SupabaseClient,
  embed: {
    movie_id: string
    youtube_video_id: string
    is_official_trailer?: boolean
    is_full_content?: boolean
    is_recap?: boolean
    language?: string
  }
): Promise<void> {
  const { error } = await client
    .from('youtube_embeds')
    .upsert(
      {
        is_official_trailer: true,
        is_full_content: false,
        is_recap: false,
        language: 'en',
        ...embed,
      },
      { onConflict: 'movie_id,youtube_video_id' }
    )

  if (error) throw new Error(`upsertYoutubeEmbed failed: ${error.message}`)
}
