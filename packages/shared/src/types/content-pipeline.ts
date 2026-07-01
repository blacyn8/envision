import { z } from 'zod'
import { QualitySchema, LinkTypeSchema, YoutubeEmbedSchema } from './index'
import type { LinkType, YoutubeEmbed } from './index'
export { LinkTypeSchema, YoutubeEmbedSchema }
export type { LinkType, YoutubeEmbed }

// ─── External Links ───────────────────────────────────────────────────────────

export const ExternalLinkSchema = z.object({
  id: z.string().uuid(),
  movie_id: z.string().uuid(),
  provider_name: z.string(),       // e.g. 'netnaija', 'fzmovies', 'youtube'
  link_type: LinkTypeSchema,
  url: z.string().url(),
  quality: QualitySchema.nullable(),
  is_active: z.boolean().default(true),
  last_checked: z.string().datetime().nullable(),
  click_count: z.number().int().default(0),
  created_at: z.string().datetime(),
})
export type ExternalLink = z.infer<typeof ExternalLinkSchema>

// ─── Scraper Log ──────────────────────────────────────────────────────────────

export const ScraperStatusSchema = z.enum(['running', 'success', 'partial', 'failed'])
export type ScraperStatus = z.infer<typeof ScraperStatusSchema>

export const ScraperLogSchema = z.object({
  id: z.string().uuid(),
  source_name: z.string(),         // e.g. 'tmdb_sync', 'netnaija_scraper'
  run_at: z.string().datetime(),
  finished_at: z.string().datetime().nullable(),
  items_found: z.number().int().default(0),
  items_added: z.number().int().default(0),
  items_updated: z.number().int().default(0),
  items_failed: z.number().int().default(0),
  status: ScraperStatusSchema,
  error_message: z.string().nullable(),
})
export type ScraperLog = z.infer<typeof ScraperLogSchema>

// YoutubeEmbedSchema / YoutubeEmbed re-exported from ./index above —
// that version matches the youtube_embeds DB columns (includes `title`).

// ─── Scraper input/output shapes ──────────────────────────────────────────────

export interface ScrapedLinkResult {
  movie_title: string
  movie_year?: number
  links: Array<{
    url: string
    link_type: LinkType
    quality?: string
    provider_name: string
  }>
}

export interface ScraperRunResult {
  source_name: string
  items_found: number
  items_added: number
  items_updated: number
  items_failed: number
  status: ScraperStatus
  error_message?: string
}

// ─── RSS Sources ──────────────────────────────────────────────────────────────

export const RssSourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),                 // e.g. 'nyaa-anime', 'subsplease-anime'
  feed_url: z.string().url(),
  region: z.string(),               // Region — kept loose to avoid circular import
  is_active: z.boolean().default(true),
  last_run_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
})
export type RssSource = z.infer<typeof RssSourceSchema>

// ─── Scrape Targets ───────────────────────────────────────────────────────────

export const ScrapeTargetSchema = z.object({
  id: z.string().uuid(),
  provider_name: z.string(),        // e.g. 'fzmovies', 'netnaija'
  base_url: z.string().url(),
  region: z.string(),
  list_selector: z.string().nullable(),
  title_selector: z.string().nullable(),
  link_selector: z.string().nullable(),
  is_active: z.boolean().default(false),
  created_at: z.string().datetime(),
})
export type ScrapeTarget = z.infer<typeof ScrapeTargetSchema>

// ─── RSS feed item shape (post-parse, before normalisation) ──────────────────

export interface RssFeedItem {
  title: string
  link: string
  pubDate: string
  description?: string
  // Anime-specific (parsed from title where possible)
  episode_number?: number
  resolution?: string               // e.g. '1080p'
}
