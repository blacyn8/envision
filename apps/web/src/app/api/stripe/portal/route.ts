/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session.
 * Lets users cancel, upgrade, or update payment details themselves.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient, supabaseAdmin } from '@/lib/supabase.server'
import { createPortalSession } from '@/services/stripe.service'
import { getProfile } from '@flixaura/db'

export async function POST(req: NextRequest) {
  try {
    const supabase = createSessionClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getProfile(supabaseAdmin, user.id)

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const portalUrl = await createPortalSession(
      profile.stripe_customer_id,
      `${appUrl}/profile`
    )

    return NextResponse.json({ url: portalUrl })
  } catch (err) {
    console.error('[POST /api/stripe/portal]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
