/**
 * sync-tmdb.ts — TMDB content sync job
 *
 * Fetches popular/trending movies from TMDB across:
 *   - Global trending (Hollywood, KDrama, Bollywood, Anime via language detection)
 *   - Kenyan, Nigerian, South African productions (via origin_country)
 *
 * Upserts everything into the movies table. Safe to run repeatedly —
 * upsert by tmdb_id means re-runs update existing rows, not duplicate them.
 *
 * Called by: /api/cron/sync-tmdb (every 6 hours)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getTmdbTrending,
  getTmdbByCountry,
  getTmdbByRegion,
  normaliseTmdbMovie,
  getTmdbMovie,
  getTmdbSeries,
  getTmdbVideos,
  pickBestTrailer,
} from '../tmdb.service'
import { upsertMovie, upsertYoutubeEmbed } from '@flixaura/db'
import type { RunCounters } from './log'

const SYNC_PAGES_PER_SOURCE = 2 // ~40 titles per source per run — keeps within rate limits

/**
 * Main entry point — runs the full TMDB sync across all sources.
 */
export async function runTmdbSync(client: SupabaseClient): Promise<RunCounters> {
  const counters: RunCounters = {
    items_found: 0,
    items_added: 0,
    items_updated: 0,
    items_skipped: 0,
  }

  // ─── 1. Global trending (covers Hollywood mostly) ──────────────────────────
  await syncFromPages(
    client,
    counters,
    (page) => getTmdbTrending('week', page),
    undefined // let normaliser detect region
  )

  // ─── 2. African content — Kenya, Nigeria, South Africa ─────────────────────
  for (const country of ['KE', 'NG', 'ZA'] as const) {
    await syncFromPages(
      client,
      counters,
      (page) => getTmdbByCountry(country, page),
      undefined
    )
  }

  // ─── 3. KDrama, Bollywood, Anime ────────────────────────────────────────────
  for (const region of ['kdrama', 'bollywood', 'anime'] as const) {
    await syncFromPages(
      client,
      counters,
      (page) => getTmdbByRegion(region, page),
      region
    )
  }

  return counters
}

/**
 * Fetches N pages from a TMDB endpoint and upserts each result.
 */
async function syncFromPages(
  client: SupabaseClient,
  counters: RunCounters,
  fetchPage: (page: number) => Promise<{ results: any[] }>,
  overrideRegion: Parameters<typeof normaliseTmdbMovie>[1]
): Promise<void> {
  for (let page = 1; page <= SYNC_PAGES_PER_SOURCE; page++) {
    let results: any[] = []

    try {
      const res = await fetchPage(page)
      results = res.results ?? []
    } catch (err) {
      console.error(`TMDB page fetch failed (page ${page}):`, err)
      continue // skip this page, keep going
    }

    counters.items_found += results.length

    for (const item of results) {
      try {
        // Skip items with no poster — usually low-quality/incomplete entries
        if (!item.poster_path) {
          counters.items_skipped++
          continue
        }

        // For trending results, media_type tells us movie vs tv.
        // Fetch full details to get genres, runtime, season counts, etc.
        const isTV = item.media_type === 'tv'
        const fullDetails = isTV
          ? await getTmdbSeries(item.id).catch(() => item)
          : await getTmdbMovie(item.id).catch(() => item)

        const normalised = normaliseTmdbMovie(
          { ...item, ...fullDetails, media_type: item.media_type },
          overrideRegion
        )

        const existing = await client
          .from('movies')
          .select('id')
          .eq('tmdb_id', normalised.tmdb_id)
          .single()

        const movie = await upsertMovie(client, normalised)

        // Best-effort — a missing/failed trailer fetch shouldn't fail the sync.
        await getTmdbVideos(item.id, isTV, normalised.language)
          .then((videos) => {
            const trailer = pickBestTrailer(videos.results)
            if (!trailer) return
            return upsertYoutubeEmbed(client, {
              movie_id: movie.id,
              youtube_video_id: trailer.key,
              is_official_trailer: true,
              is_full_content: false,
              title: trailer.name,
            })
          })
          .catch((err) => console.error(`Trailer fetch failed for TMDB item ${item.id}:`, err))

        if (existing.data) {
          counters.items_updated++
        } else {
          counters.items_added++
        }
      } catch (err) {
        console.error(`Failed to upsert TMDB item ${item.id}:`, err)
        counters.items_skipped++
      }

      // Gentle rate limiting — TMDB allows ~50 req/sec but be polite
      await sleep(50)
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
