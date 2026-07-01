import { z } from 'zod'

// ─── Enums / Literals ─────────────────────────────────────────────────────────

export const RegionSchema = z.enum([
  'hollywood',
  'nollywood',
  'kdrama',
  'bollywood',
  'anime',
  'african',
])
export type Region = z.infer<typeof RegionSchema>

export const GenreSchema = z.enum([
  'action',
  'romance',
  'thriller',
  'comedy',
  'horror',
  'sci-fi',
  'drama',
  'animation',
  'documentary',
  'fantasy',
])
export type Genre = z.infer<typeof GenreSchema>

export const QualitySchema = z.enum(['4K', 'HD', '720p', '480p', '360p', '3GP'])
export type Quality = z.infer<typeof QualitySchema>

export const FormatSchema = z.enum(['MKV', 'MP4', 'AVI', '3GP', 'WebM'])
export type Format = z.infer<typeof FormatSchema>

export const LinkTypeSchema = z.enum(['stream', 'download'])
export type LinkType = z.infer<typeof LinkTypeSchema>

export const ContentTypeSchema = z.enum(['movie', 'series', 'anime'])
export type ContentType = z.infer<typeof ContentTypeSchema>

// ScraperStatus / ScraperLog live in ./content-pipeline — that version matches
// the actual scraper_log DB columns (items_failed, not items_skipped).

export const SubscriptionTierSchema = z.enum(['free', 'premium', 'pro'])
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>

// ─── Download Link ────────────────────────────────────────────────────────────

export const DownloadLinkSchema = z.object({
  id: z.string().uuid(),
  movie_id: z.string().uuid(),
  url: z.string().url(),
  quality: QualitySchema,
  format: FormatSchema,
  link_type: LinkTypeSchema.default('download'),
  source: z.string(),        // e.g. "netnaija", "o2tv", "tmdb-direct"
  verified: z.boolean().default(false),
  verified_at: z.string().datetime().nullable(),
  is_active: z.boolean().default(true),
  last_checked: z.string().datetime().nullable(),
  check_failures: z.number().int().default(0),
  file_size_mb: z.number().nullable(),
  created_at: z.string().datetime(),
})
export type DownloadLink = z.infer<typeof DownloadLinkSchema>

// ─── YouTube Embed (Phase B readiness) ───────────────────────────────────────

export const YoutubeEmbedSchema = z.object({
  id: z.string().uuid(),
  movie_id: z.string().uuid(),
  youtube_video_id: z.string(),
  is_official_trailer: z.boolean().default(true),
  is_full_content: z.boolean().default(false),
  is_recap: z.boolean().default(false),
  language: z.string().default('en'),
  title: z.string().nullable(),
  created_at: z.string().datetime(),
})
export type YoutubeEmbed = z.infer<typeof YoutubeEmbedSchema>

// ─── Movie / Series ───────────────────────────────────────────────────────────

export const MovieSchema = z.object({
  id: z.string().uuid(),
  tmdb_id: z.number().nullable(),       // null for Nollywood/African-only titles
  title: z.string(),
  slug: z.string(),                     // url-safe unique identifier
  region: RegionSchema,
  content_type: ContentTypeSchema,
  genres: z.array(GenreSchema),
  year: z.number().int(),
  runtime_minutes: z.number().nullable(),
  synopsis: z.string().nullable(),
  poster_url: z.string().url().nullable(),
  backdrop_url: z.string().url().nullable(),
  language: z.string(),                 // ISO 639-1, e.g. "en", "yo", "ko"
  country_origin: z.string().length(2).nullable(),  // ISO 3166-1 alpha-2, e.g. "KE", "NG"
  rating: z.number().min(0).max(10).nullable(),
  rating_count: z.number().int().default(0),
  is_series: z.boolean().default(false),
  season_count: z.number().int().nullable(),
  episode_count: z.number().int().nullable(),
  has_subtitle_en: z.boolean().default(false),
  has_subtitle_sw: z.boolean().default(false),  // Swahili
  has_subtitle_yo: z.boolean().default(false),  // Yoruba
  ai_tags: z.array(z.string()).default([]),     // LLM-generated mood/trope tags
  mood_tags: z.array(z.string()).default([]),   // pipeline-assigned mood tags for filtering
  source_priority: z.number().int().default(0), // higher = more trusted source wins on conflict
  download_links: z.array(DownloadLinkSchema).optional(),
  youtube_embeds: z.array(z.lazy(() => YoutubeEmbedSchema)).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
export type Movie = z.infer<typeof MovieSchema>

// ─── User ─────────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  subscription_tier: SubscriptionTierSchema.default('free'),
  subscription_expires_at: z.string().datetime().nullable(),
  stripe_customer_id: z.string().nullable(),
  created_at: z.string().datetime(),
})
export type User = z.infer<typeof UserSchema>

// ─── User Interaction ─────────────────────────────────────────────────────────

export const UserInteractionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  movie_id: z.string().uuid(),
  in_watchlist: z.boolean().default(false),
  user_rating: z.number().min(1).max(10).nullable(),
  watched: z.boolean().default(false),
  watched_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
})
export type UserInteraction = z.infer<typeof UserInteractionSchema>

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export interface MovieFilters {
  region?: Region
  genre?: Genre
  year?: number
  quality?: Quality
  has_subtitle?: boolean
  content_type?: ContentType
  query?: string
  page?: number
  per_page?: number
}

export interface AISearchResult {
  movies: Movie[]
  interpreted_query: string   // what the LLM understood from the user's natural language
  filters_used: MovieFilters
}
