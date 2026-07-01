/**
 * tmdb.ts — TMDB API client
 *
 * Handles all communication with The Movie Database API.
 * https://developer.themoviedb.org/docs
 *
 * Server-only — never import this in client components.
 * The TMDB_API_KEY is not prefixed with NEXT_PUBLIC_ intentionally.
 */

import type { Region } from '@flixaura/shared'

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

// ─── TMDB raw types ───────────────────────────────────────────────────────────

export interface TmdbMovie {
  id: number
  title?: string
  name?: string                    // TV series use 'name' instead of 'title'
  original_title?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string            // movies
  first_air_date?: string          // TV series
  vote_average: number
  vote_count: number
  runtime?: number
  episode_run_time?: number[]      // TV series
  number_of_seasons?: number
  number_of_episodes?: number
  genres?: Array<{ id: number; name: string }>
  original_language: string
  media_type?: 'movie' | 'tv'
  origin_country?: string[]                              // ISO codes, e.g. ["KE"]
  production_countries?: Array<{ iso_3166_1: string; name: string }>
}

export interface TmdbSearchResult {
  results: TmdbMovie[]
  total_results: number
  total_pages: number
  page: number
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) throw new Error('TMDB_API_KEY is not set')

  const url = new URL(`${TMDB_BASE}${endpoint}`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('language', 'en-US')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // Cache for 1 hour (Next.js fetch cache)
  })

  if (!res.ok) {
    throw new Error(`TMDB fetch failed: ${res.status} ${res.statusText} — ${endpoint}`)
  }

  return res.json() as Promise<T>
}

// ─── Image URL helpers ────────────────────────────────────────────────────────

export type PosterSize = 'w185' | 'w342' | 'w500' | 'w780' | 'original'
export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original'

export function tmdbPosterUrl(path: string | null, size: PosterSize = 'w500'): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export function tmdbBackdropUrl(path: string | null, size: BackdropSize = 'w1280'): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

// ─── TMDB genre ID → Flix-Aura genre mapping ───────────────────────────────────

const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'action',
  10749: 'romance',
  53: 'thriller',
  35: 'comedy',
  27: 'horror',
  878: 'sci-fi',
  18: 'drama',
  16: 'animation',
  99: 'documentary',
  14: 'fantasy',
  12: 'action',   // adventure → action
  80: 'thriller', // crime → thriller
  9648: 'thriller', // mystery → thriller
}

export function mapTmdbGenres(genres: Array<{ id: number; name: string }> = []): string[] {
  const mapped = genres
    .map((g) => TMDB_GENRE_MAP[g.id])
    .filter((g): g is string => Boolean(g))
  return [...new Set(mapped)] // deduplicate
}

// ─── TMDB language → Flix-Aura region mapping ──────────────────────────────────

export function tmdbLangToRegion(language: string, mediaType?: string): Region {
  if (mediaType === 'tv' && language === 'ko') return 'kdrama'
  if (language === 'ko') return 'kdrama'
  if (language === 'ja') return 'anime'
  if (language === 'hi' || language === 'ta' || language === 'te') return 'bollywood'
  return 'hollywood'
}

// ─── Movie queries ────────────────────────────────────────────────────────────

/**
 * Search for movies and TV series by keyword.
 */
export async function searchTmdb(
  query: string,
  page = 1
): Promise<TmdbSearchResult> {
  return tmdbFetch<TmdbSearchResult>('/search/multi', {
    query,
    page: String(page),
    include_adult: 'false',
  })
}

/**
 * Get full details for a single movie by TMDB ID.
 */
export async function getTmdbMovie(tmdbId: number): Promise<TmdbMovie> {
  return tmdbFetch<TmdbMovie>(`/movie/${tmdbId}`)
}

/**
 * Get full details for a TV series by TMDB ID.
 */
export async function getTmdbSeries(tmdbId: number): Promise<TmdbMovie> {
  return tmdbFetch<TmdbMovie>(`/tv/${tmdbId}`)
}

/**
 * Get the current trending movies and shows (day or week window).
 */
export async function getTmdbTrending(
  window: 'day' | 'week' = 'week',
  page = 1
): Promise<TmdbSearchResult> {
  return tmdbFetch<TmdbSearchResult>(`/trending/all/${window}`, {
    page: String(page),
  })
}

/**
 * Get popular movies from a specific region using language filter.
 */
export async function getTmdbByRegion(
  region: Extract<Region, 'hollywood' | 'kdrama' | 'bollywood' | 'anime'>,
  page = 1
): Promise<TmdbSearchResult> {
  const languageMap: Record<string, string> = {
    hollywood: 'en',
    kdrama: 'ko',
    bollywood: 'hi',
    anime: 'ja',
  }

  const lang = languageMap[region] ?? 'en'

  return tmdbFetch<TmdbSearchResult>('/discover/movie', {
    with_original_language: lang,
    sort_by: 'vote_average.desc',
    'vote_count.gte': '100',
    page: String(page),
  })
}

/**
 * Get popular movies produced in a specific country.
 * This is the key function for African content — Kenyan, Nigerian, and South
 * African films are mostly in English, so language filters miss them.
 * TMDB's origin_country filter catches them correctly.
 */
export async function getTmdbByCountry(
  countryCode: 'KE' | 'NG' | 'ZA',
  page = 1
): Promise<TmdbSearchResult> {
  return tmdbFetch<TmdbSearchResult>('/discover/movie', {
    with_origin_country: countryCode,
    sort_by: 'popularity.desc',
    page: String(page),
  })
}

/**
 * Map a country code to a Flix-Aura region.
 */
export function countryToRegion(countryCode: string | null | undefined): Region {
  if (countryCode === 'NG') return 'nollywood'
  if (countryCode === 'KE' || countryCode === 'ZA') return 'african'
  return 'hollywood'
}

/**
 * Get now-playing movies (good for "new releases").
 */
export async function getTmdbNowPlaying(page = 1): Promise<TmdbSearchResult> {
  return tmdbFetch<TmdbSearchResult>('/movie/now_playing', {
    page: String(page),
  })
}

/**
 * Get upcoming movies.
 */
export async function getTmdbUpcoming(page = 1): Promise<TmdbSearchResult> {
  return tmdbFetch<TmdbSearchResult>('/movie/upcoming', {
    page: String(page),
  })
}

// ─── Normalise TMDB → Flix-Aura Movie shape ────────────────────────────────────

import { slugify } from '@flixaura/shared'

/**
 * Convert a raw TMDB movie object to the Flix-Aura Movie insert shape.
 * Does not include download_links (those come from the scraper).
 */
export function normaliseTmdbMovie(
  raw: TmdbMovie,
  overrideRegion?: Region
): Omit<any, 'id' | 'created_at' | 'updated_at' | 'download_links'> {
  const isTV = raw.media_type === 'tv' || !!raw.name
  const title = raw.title ?? raw.name ?? 'Untitled'
  const year = parseInt(
    (raw.release_date ?? raw.first_air_date ?? '2000').slice(0, 4)
  )

  // Determine country of origin — prefer origin_country array, fall back to
  // production_countries. This is what catches Kenyan/Nigerian/SA films.
  const countryOrigin =
    raw.origin_country?.[0] ?? raw.production_countries?.[0]?.iso_3166_1 ?? null

  // Region priority: explicit override > country-based > language-based
  const region =
    overrideRegion ??
    (countryOrigin && ['NG', 'KE', 'ZA'].includes(countryOrigin)
      ? countryToRegion(countryOrigin)
      : tmdbLangToRegion(raw.original_language, raw.media_type))

  return {
    tmdb_id: raw.id,
    title,
    slug: slugify(`${title}-${year}`),
    region,
    content_type: region === 'anime' ? 'anime' : isTV ? 'series' : 'movie',
    genres: mapTmdbGenres(raw.genres ?? []),
    year,
    runtime_minutes: raw.runtime ?? raw.episode_run_time?.[0] ?? null,
    synopsis: raw.overview || null,
    poster_url: tmdbPosterUrl(raw.poster_path),
    backdrop_url: tmdbBackdropUrl(raw.backdrop_path),
    language: raw.original_language,
    country_origin: countryOrigin,
    rating: raw.vote_average ? parseFloat(raw.vote_average.toFixed(1)) : null,
    rating_count: raw.vote_count ?? 0,
    is_series: isTV,
    season_count: raw.number_of_seasons ?? null,
    episode_count: raw.number_of_episodes ?? null,
    has_subtitle_en: true,   // TMDB content almost always has English subs
    has_subtitle_sw: false,
    has_subtitle_yo: false,
    ai_tags: [],
    mood_tags: [],
    source_priority: 10,  // TMDB is a high-trust source
  }
}
