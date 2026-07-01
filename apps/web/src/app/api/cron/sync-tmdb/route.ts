/**
 * GET /api/cron/sync-tmdb
 *
 * Triggered by Vercel Cron every 6 hours.
 * Syncs trending + African + KDrama/Bollywood/Anime content from TMDB.
 *
 * Protected by CRON_SECRET — Vercel Cron sends this automatically when
 * configured in vercel.json. Manual calls must include the same header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { runTmdbSync } from '@/services/pipeline/sync-tmdb'
import { withRunLogging } from '@/services/pipeline/log'

export const maxDuration = 300 // 5 minutes — TMDB sync fetches many pages

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await withRunLogging(supabaseAdmin, 'tmdb', () =>
      runTmdbSync(supabaseAdmin)
    )

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('TMDB sync cron failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
