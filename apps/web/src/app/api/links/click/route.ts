/**
 * POST /api/links/click
 * Body: { linkId: string }
 *
 * Increments the click counter on an external link.
 * Called when a user clicks a "Watch" or "Download" button on /watch.
 * Used to rank popular links and inform future ad placement decisions.
 *
 * This is fire-and-forget from the client — failures here should never
 * block the user from reaching their download/stream link.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { incrementLinkClickCount } from '@flixaura/db'

export async function POST(request: NextRequest) {
  try {
    const { linkId } = await request.json()

    if (!linkId || typeof linkId !== 'string') {
      return NextResponse.json({ error: 'linkId is required' }, { status: 400 })
    }

    await incrementLinkClickCount(supabaseAdmin, linkId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Failed to record link click:', err)
    // Non-fatal — don't surface this to the user
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
