/**
 * POST /api/auth/signup
 * Creates a new user account via Supabase Auth.
 * The database trigger (handle_new_user) auto-creates the profile row.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient } from '@/lib/supabase.server'

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const supabase = createSessionClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          // Passed to the handle_new_user trigger as raw_user_meta_data
          full_name: displayName ?? '',
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      // Supabase sends a confirmation email when email confirmation is enabled.
      // If disabled in your Supabase settings, user is signed in immediately.
      requiresConfirmation: !data.session,
    })
  } catch (err) {
    console.error('[POST /api/auth/signup]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
