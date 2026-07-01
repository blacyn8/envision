/**
 * POST /api/auth/logout
 * Signs out the current user and clears the session cookie.
 */

import { NextResponse } from 'next/server'
import { createSessionClient } from '@/lib/supabase.server'

export async function POST() {
  try {
    const supabase = createSessionClient()
    await supabase.auth.signOut()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/auth/logout]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
