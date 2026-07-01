/**
 * Seed script — populates the database with sample movies for local development.
 * Run with: npm run db:seed (from packages/db)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your env.
 */

import { getServerClient } from './client'
import { slugify } from '@flixaura/shared'

const SAMPLE_MOVIES = [
  // Hollywood
  {
    title: 'Dune: Part Three',
    region: 'hollywood',
    content_type: 'movie',
    genres: ['sci-fi', 'action'],
    year: 2025,
    runtime_minutes: 162,
    language: 'en',
    rating: 8.4,
    synopsis: 'Paul Atreides continues his journey as the messiah of Arrakis, facing the ultimate cost of prophecy.',
    has_subtitle_en: true,
  },
  {
    title: 'Mission Rogue',
    region: 'hollywood',
    content_type: 'movie',
    genres: ['action', 'thriller'],
    year: 2025,
    runtime_minutes: 140,
    language: 'en',
    rating: 7.9,
    synopsis: 'An elite spy is framed for treason and must dismantle the conspiracy from inside.',
    has_subtitle_en: true,
  },
  // Nollywood
  {
    title: 'Blood & Clay',
    region: 'nollywood',
    content_type: 'movie',
    genres: ['thriller', 'drama'],
    year: 2025,
    runtime_minutes: 120,
    language: 'yo',
    rating: 9.1,
    synopsis: "A village sculptor discovers an ancient secret buried beneath the community's history.",
    has_subtitle_en: true,
    has_subtitle_yo: true,
  },
  {
    title: 'Lagos After Dark',
    region: 'nollywood',
    content_type: 'series',
    genres: ['thriller', 'romance'],
    year: 2024,
    is_series: true,
    season_count: 2,
    episode_count: 24,
    language: 'en',
    rating: 8.5,
    synopsis: 'A crime journalist and a detective navigate Lagos\'s underground while falling dangerously in love.',
    has_subtitle_en: true,
  },
  // KDrama
  {
    title: 'When We Were Ours',
    region: 'kdrama',
    content_type: 'series',
    genres: ['romance', 'drama'],
    year: 2025,
    is_series: true,
    season_count: 1,
    episode_count: 16,
    language: 'ko',
    rating: 8.7,
    synopsis: 'Two childhood friends reunite years later, but the truth of their past threatens everything.',
    has_subtitle_en: true,
  },
  {
    title: 'The Last Detective',
    region: 'kdrama',
    content_type: 'series',
    genres: ['thriller', 'drama'],
    year: 2024,
    is_series: true,
    season_count: 1,
    episode_count: 12,
    language: 'ko',
    rating: 9.0,
    synopsis: 'A disgraced detective takes one final case that will either redeem him or destroy him.',
    has_subtitle_en: true,
  },
  // Bollywood
  {
    title: 'Kalki Returns',
    region: 'bollywood',
    content_type: 'movie',
    genres: ['action', 'fantasy'],
    year: 2025,
    runtime_minutes: 175,
    language: 'hi',
    rating: 8.2,
    synopsis: 'The mythic warrior Kalki rises again in the modern age to confront an ancient evil.',
    has_subtitle_en: true,
  },
  // Anime
  {
    title: 'Attack on Titan: The Final Chapter',
    region: 'anime',
    content_type: 'anime',
    genres: ['action', 'drama'],
    year: 2024,
    runtime_minutes: 90,
    language: 'ja',
    rating: 9.3,
    synopsis: 'The ultimate conclusion to the world-spanning war for humanity\'s survival.',
    has_subtitle_en: true,
  },
  {
    title: 'Demon Slayer: Infinity Arc',
    region: 'anime',
    content_type: 'anime',
    genres: ['action', 'fantasy'],
    year: 2025,
    is_series: true,
    season_count: 1,
    episode_count: 12,
    language: 'ja',
    rating: 8.9,
    synopsis: 'Tanjiro faces demons beyond anything the Demon Slayer Corps has encountered before.',
    has_subtitle_en: true,
  },
  // African TV
  {
    title: 'Nairobi Nights',
    region: 'african',
    content_type: 'series',
    genres: ['drama', 'thriller'],
    year: 2025,
    is_series: true,
    season_count: 1,
    episode_count: 10,
    language: 'sw',
    rating: 8.0,
    synopsis: 'A Nairobi investigative reporter uncovers a corruption ring that reaches the highest levels of government.',
    has_subtitle_en: true,
    has_subtitle_sw: true,
  },
]

async function seed() {
  const client = getServerClient()
  console.log('🌱 Seeding database...')

  let inserted = 0
  let skipped = 0

  for (const movie of SAMPLE_MOVIES) {
    const slug = slugify(`${movie.title}-${movie.year}`)

    const { error } = await client
      .from('movies')
      .upsert(
        { ...movie, slug },
        { onConflict: 'slug', ignoreDuplicates: true }
      )

    if (error) {
      console.error(`  ✗ Failed to seed "${movie.title}":`, error.message)
      skipped++
    } else {
      console.log(`  ✓ ${movie.title} (${movie.year}) — ${movie.region}`)
      inserted++
    }
  }

  console.log(`\n✅ Done. ${inserted} inserted, ${skipped} skipped.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
