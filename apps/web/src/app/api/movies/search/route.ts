/**
 * GET /api/movies/search?q=<query>
 *
 * Title-based search — powers the /watch "Search & Get" page.
 * Returns movies matching the query along with their YouTube embeds
 * (trailer / full movie) where available.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { searchMovies, getYoutubeEmbedsForMovie } from '@flixaura/db'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  const movies = await searchMovies(supabaseAdmin, query, 12)

  // Attach YouTube embeds for each result.
  // Run in parallel — small result set (max 12) keeps this fast.
  const results = await Promise.all(
    movies.map(async (movie) => {
      const embeds = await getYoutubeEmbedsForMovie(supabaseAdmin, movie.id)

      return {
        movie,
        trailer: embeds.find((e) => e.is_official_trailer) ?? null,
        fullMovie: embeds.find((e) => e.is_full_content) ?? null,
        recap: embeds.find((e) => e.is_recap) ?? null,
      }
    })
  )

  return NextResponse.json({ results })
}
