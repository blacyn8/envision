/**
 * GET /api/movies/search?q=<query>
 *
 * Title-based search — powers the /watch "Search & Get" page.
 * Returns movies matching the query along with their external links
 * (stream/download) and YouTube embeds where available.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { searchMovies, getExternalLinksForMovie, getYoutubeEmbedsForMovie } from '@flixaura/db'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  const movies = await searchMovies(supabaseAdmin, query, 12)

  // Attach external links and YouTube embeds for each result.
  // Run in parallel — small result set (max 12) keeps this fast.
  const results = await Promise.all(
    movies.map(async (movie) => {
      const [allLinks, embeds] = await Promise.all([
        getExternalLinksForMovie(supabaseAdmin, movie.id),
        getYoutubeEmbedsForMovie(supabaseAdmin, movie.id),
      ])

      return {
        movie,
        links: {
          stream: allLinks.filter((l) => l.link_type === 'stream'),
          download: allLinks.filter((l) => l.link_type === 'download'),
        },
        trailer: embeds.find((e) => e.is_official_trailer) ?? null,
      }
    })
  )

  return NextResponse.json({ results })
}
