/**
 * GET /api/cron/check-links
 *
 * Triggered by Vercel Cron daily.
 * Verifies download links are still reachable, deactivating dead ones.
 *
 * Protected by CRON_SECRET — Vercel Cron sends this automatically when
 * configured in vercel.json. Manual calls must include the same header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { runLinkCheck } from '@/services/pipeline/link-checker'
import { withRunLogging } from '@/services/pipeline/log'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes — checking many links takes time

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await withRunLogging(supabaseAdmin, 'link-checker', () =>
      runLinkCheck(supabaseAdmin)
    )

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Link check cron failed:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
