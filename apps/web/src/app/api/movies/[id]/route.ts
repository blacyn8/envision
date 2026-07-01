/**
 * GET /api/movies/[id]
 * Returns a single movie's full data including its YouTube embeds.
 * Used by the mobile app and any client that needs JSON.
 * The web app uses server components directly — this route is for API consumers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { getMovieBySlug, getYoutubeEmbedsForMovie } from '@flixaura/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // `id` param doubles as a slug — slugs are the canonical URL identifier
    const movie = await getMovieBySlug(supabaseAdmin, params.id)

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    const embeds = await getYoutubeEmbedsForMovie(supabaseAdmin, movie.id)

    return NextResponse.json({ movie, embeds })
  } catch (err) {
    console.error('[GET /api/movies/[id]]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
