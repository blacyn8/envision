/**
 * GET /api/cron/run-scrapers
 *
 * Triggered by Vercel Cron every 12 hours.
 * Runs all active scrape targets and logs results.
 *
 * Protected by CRON_SECRET — Vercel Cron sends this automatically when
 * configured in vercel.json. Manual calls must include the same header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { runScrapers } from '@/services/pipeline/run-scrapers'
import { withRunLogging } from '@/services/pipeline/log'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min max (Vercel Pro limit)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await withRunLogging(supabaseAdmin, 'scrapers', () =>
      runScrapers(supabaseAdmin)
    )

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Scraper cron failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
