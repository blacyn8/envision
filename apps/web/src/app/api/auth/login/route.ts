/**
 * POST /api/auth/login
 * Signs the user in with email + password via Supabase Auth.
 * On success, Supabase sets a session cookie automatically.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient } from '@/lib/supabase.server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createSessionClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Return 401 for wrong credentials, not 500
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
