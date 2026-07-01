/**
 * POST /api/ai/recommend
 * Uses Claude to generate personalised movie recommendations
 * based on the user's watch history and preferences.
 *
 * Body: { query?: string } — optional natural language input
 *       e.g. "show me something like Squid Game but Nigerian"
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient, supabaseAdmin } from '@/lib/supabase.server'
import { getAiRecommendations, chatDiscover } from '@/services/claude.service'
import { getWatchHistory, searchMovies } from '@flixaura/db'

export async function POST(req: NextRequest) {
  try {
    const supabase = createSessionClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { query, messages } = await req.json()

    // ── Chat discovery mode (has conversation history) ──────────────────────
    if (messages && Array.isArray(messages)) {
      const { reply, suggestedTitles } = await chatDiscover(messages)

      // Look up each suggested title in our DB
      const movieResults = await Promise.all(
        suggestedTitles.slice(0, 5).map((title) =>
          searchMovies(supabaseAdmin, title, 1).then((r) => r[0] ?? null)
        )
      )

      return NextResponse.json({
        reply,
        movies: movieResults.filter(Boolean),
      })
    }

    // ── Personalised recommendations (logged in user) ────────────────────────
    if (user) {
      const history = await getWatchHistory(supabaseAdmin, user.id, 20)

      const watchedTitles = history.map((h) => h.movie?.title ?? '').filter(Boolean)
      const preferredRegions = Array.from(
        new Set(history.map((h) => h.movie?.region ?? '').filter(Boolean))
      )
      const preferredGenres = Array.from(
        new Set(history.flatMap((h) => h.movie?.genres ?? []))
      )

      const titles = await getAiRecommendations({
        watchedTitles,
        preferredGenres,
        preferredRegions,
        excludeTitles: watchedTitles,
      })

      const movies = await Promise.all(
        titles.map((title) =>
          searchMovies(supabaseAdmin, title, 1).then((r) => r[0] ?? null)
        )
      )

      return NextResponse.json({ movies: movies.filter(Boolean) })
    }

    // ── Guest mode — trending fallback ───────────────────────────────────────
    const { getTrendingMovies } = await import('@flixaura/db')
    const trending = await getTrendingMovies(supabaseAdmin, 10)
    return NextResponse.json({ movies: trending })
  } catch (err) {
    console.error('[POST /api/ai/recommend]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
