/**
 * /api/watchlist
 *
 * GET    — fetch the current user's watchlist
 * POST   — add a movie to the watchlist  { movieId }
 * DELETE — remove a movie from watchlist { movieId }
 *
 * All routes are protected — a valid Supabase session cookie is required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient } from '@/lib/supabase.server'
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '@flixaura/db'

// ─── GET /api/watchlist ───────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = createSessionClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const watchlist = await getWatchlist(supabase, user.id)
    const movieIds = watchlist.map((entry) => entry.movie_id)
    return NextResponse.json({ watchlist, movieIds })
  } catch (err) {
    console.error('[GET /api/watchlist]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ─── POST /api/watchlist ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = createSessionClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { movieId } = await req.json()
    if (!movieId) {
      return NextResponse.json({ error: 'movieId is required' }, { status: 400 })
    }

    await addToWatchlist(supabase, user.id, movieId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/watchlist]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ─── DELETE /api/watchlist ────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createSessionClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { movieId } = await req.json()
    if (!movieId) {
      return NextResponse.json({ error: 'movieId is required' }, { status: 400 })
    }

    await removeFromWatchlist(supabase, user.id, movieId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/watchlist]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
