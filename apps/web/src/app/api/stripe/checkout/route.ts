/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for a subscription plan.
 * Returns the Stripe-hosted checkout URL to redirect the user to.
 *
 * Body: { priceId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSessionClient } from '@/lib/supabase.server'
import { createCheckoutSession, PRICE_IDS } from '@/services/stripe.service'

export async function POST(req: NextRequest) {
  try {
    const supabase = createSessionClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId } = await req.json()

    // Validate priceId is one of our known plans
    const validPriceIds = Object.values(PRICE_IDS)
    if (!priceId || !validPriceIds.includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const checkoutUrl = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email!,
      priceId,
      successUrl: `${appUrl}/profile?subscription=success`,
      cancelUrl: `${appUrl}/profile?subscription=cancelled`,
    })

    return NextResponse.json({ url: checkoutUrl })
  } catch (err) {
    console.error('[POST /api/stripe/checkout]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
