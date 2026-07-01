/**
 * movies.ts — All database queries relating to movies and download links.
 *
 * Every function takes a Supabase client so the same queries work
 * with both the browser client (anon) and the server admin client.
 *
 * Import in API routes:
 *   import { getMovies, getMovieBySlug } from '@flixaura/db/queries/movies'
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Movie, MovieFilters, PaginatedResponse, Region, Genre } from '@flixaura/shared'

const DEFAULT_PAGE_SIZE = 24

// ─── READ QUERIES ─────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of movies.
 * Supports region, genre, year, content_type, and free-text search.
 */
export async function getMovies(
  client: SupabaseClient,
  filters: MovieFilters = {}
): Promise<PaginatedResponse<Movie>> {
  const {
    region,
    genre,
    year,
    content_type,
    query,
    page = 1,
    per_page = DEFAULT_PAGE_SIZE,
  } = filters

  const from = (page - 1) * per_page
  const to = from + per_page - 1

  let dbQuery = client
    .from('movies')
    .select('*, download_links(*)', { count: 'exact' })
    .order('rating', { ascending: false })
    .range(from, to)

  if (region) dbQuery = dbQuery.eq('region', region)
  if (genre) dbQuery = dbQuery.contains('genres', [genre])
  if (year) dbQuery = dbQuery.eq('year', year)
  if (content_type) dbQuery = dbQuery.eq('content_type', content_type)

  // Full-text search across title and synopsis
  if (query) {
    dbQuery = dbQuery.textSearch('fts', query, {
      type: 'websearch',
      config: 'english',
    })
  }

  const { data, error, count } = await dbQuery

  if (error) throw new Error(`getMovies failed: ${error.message}`)

  return {
    data: (data ?? []) as Movie[],
    total: count ?? 0,
    page,
    per_page,
    has_more: (count ?? 0) > to + 1,
  }
}

/**
 * Fetch a single movie by its URL slug, including all download links.
 */
export async function getMovieBySlug(
  client: SupabaseClient,
  slug: string
): Promise<Movie | null> {
  const { data, error } = await client
    .from('movies')
    .select('*, download_links(*)')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(`getMovieBySlug failed: ${error.message}`)
  }

  return data as Movie
}

/**
 * Fetch a single movie by its TMDB ID.
 * Used by the scraper to check if a title already exists before inserting.
 */
export async function getMovieByTmdbId(
  client: SupabaseClient,
  tmdbId: number
): Promise<Movie | null> {
  const { data, error } = await client
    .from('movies')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getMovieByTmdbId failed: ${error.message}`)
  }

  return data as Movie
}

/**
 * Fetch trending movies — sorted by rating, limited to recent years.
 */
export async function getTrendingMovies(
  client: SupabaseClient,
  limit = 12
): Promise<Movie[]> {
  const currentYear = new Date().getFullYear()

  const { data, error } = await client
    .from('movies')
    .select('*, download_links(*)')
    .gte('year', currentYear - 2)
    .order('rating', { ascending: false })
    .order('rating_count', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getTrendingMovies failed: ${error.message}`)

  return (data ?? []) as Movie[]
}

/**
 * Fetch the latest additions — most recently added to the DB.
 */
export async function getNewReleases(
  client: SupabaseClient,
  limit = 12
): Promise<Movie[]> {
  const { data, error } = await client
    .from('movies')
    .select('*, download_links(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getNewReleases failed: ${error.message}`)

  return (data ?? []) as Movie[]
}

/**
 * Fetch movies by region with optional limit.
 */
export async function getMoviesByRegion(
  client: SupabaseClient,
  region: Region,
  limit = 12
): Promise<Movie[]> {
  const { data, error } = await client
    .from('movies')
    .select('*, download_links(*)')
    .eq('region', region)
    .order('rating', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getMoviesByRegion failed: ${error.message}`)

  return (data ?? []) as Movie[]
}

/**
 * Fetch movies by genre with optional limit.
 */
export async function getMoviesByGenre(
  client: SupabaseClient,
  genre: Genre,
  limit = 12
): Promise<Movie[]> {
  const { data, error } = await client
    .from('movies')
    .select('*, download_links(*)')
    .contains('genres', [genre])
    .order('rating', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getMoviesByGenre failed: ${error.message}`)

  return (data ?? []) as Movie[]
}

/**
 * Get a count of movies per region — used for the categories grid.
 */
export async function getRegionCounts(
  client: SupabaseClient
): Promise<Record<string, number>> {
  const regions: Region[] = ['hollywood', 'nollywood', 'kdrama', 'bollywood', 'anime', 'african']
  const counts: Record<string, number> = {}

  const promises = regions.map(async (region) => {
    const { count, error } = await client
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('region', region)

    if (!error) counts[region] = count ?? 0
  })

  await Promise.all(promises)
  return counts
}

/**
 * Full-text + similarity search.
 * Falls back to ILIKE title match if full-text returns nothing.
 */
export async function searchMovies(
  client: SupabaseClient,
  query: string,
  limit = 20
): Promise<Movie[]> {
  // Try full-text search first
  const { data: ftsData, error: ftsError } = await client
    .from('movies')
    .select('*, download_links(*)')
    .textSearch('fts', query, { type: 'websearch', config: 'english' })
    .limit(limit)

  if (!ftsError && ftsData && ftsData.length > 0) {
    return ftsData as Movie[]
  }

  // Fallback: title ILIKE search
  const { data, error } = await client
    .from('movies')
    .select('*, download_links(*)')
    .ilike('title', `%${query}%`)
    .limit(limit)

  if (error) throw new Error(`searchMovies failed: ${error.message}`)

  return (data ?? []) as Movie[]
}

// ─── WRITE QUERIES ────────────────────────────────────────────────────────────

/**
 * Upsert a movie record.
 * If a movie with the same slug already exists, it updates it.
 * Used by the content pipeline / scraper.
 */
export async function upsertMovie(
  client: SupabaseClient,
  movie: Omit<Movie, 'id' | 'created_at' | 'updated_at' | 'download_links'>
): Promise<Movie> {
  const { data, error } = await client
    .from('movies')
    .upsert({ ...movie, updated_at: new Date().toISOString() }, { onConflict: 'slug' })
    .select()
    .single()

  if (error) throw new Error(`upsertMovie failed: ${error.message}`)

  return data as Movie
}

/**
 * Insert a batch of download links for a movie.
 * Skips duplicates (same movie_id + url).
 */
export async function insertDownloadLinks(
  client: SupabaseClient,
  movieId: string,
  links: Array<{
    url: string
    quality: string
    format: string
    source: string
    link_type?: string
    file_size_mb?: number
  }>
): Promise<void> {
  const rows = links.map((link) => ({
    link_type: 'download',
    ...link,
    movie_id: movieId,
  }))

  const { error } = await client
    .from('download_links')
    .upsert(rows, { onConflict: 'movie_id,url', ignoreDuplicates: true })

  if (error) throw new Error(`insertDownloadLinks failed: ${error.message}`)
}

/**
 * Update the AI embedding vector for a movie.
 * Called after the LLM generates an embedding for similarity search.
 */
export async function updateMovieEmbedding(
  client: SupabaseClient,
  movieId: string,
  embedding: number[]
): Promise<void> {
  const { error } = await client
    .from('movies')
    .update({ embedding })
    .eq('id', movieId)

  if (error) throw new Error(`updateMovieEmbedding failed: ${error.message}`)
}

/**
 * Update AI-generated tags on a movie.
 */
export async function updateMovieAiTags(
  client: SupabaseClient,
  movieId: string,
  tags: string[]
): Promise<void> {
  const { error } = await client
    .from('movies')
    .update({ ai_tags: tags })
    .eq('id', movieId)

  if (error) throw new Error(`updateMovieAiTags failed: ${error.message}`)
}
