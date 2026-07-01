/**
 * POST /api/stripe/webhook
 *
 * Stripe sends events here after payment, cancellation, or renewal.
 * This route validates the signature, then updates the user's
 * subscription tier in the Supabase profiles table.
 *
 * Events handled:
 *   checkout.session.completed  → payment successful, activate subscription
 *   customer.subscription.deleted → subscription cancelled, downgrade to free
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase.server'
import { constructWebhookEvent, getSubscriptionStatus } from '@/services/stripe.service'
import { updateSubscription, getUserByStripeId } from '@flixaura/db'

// Tell Next.js to give us the raw body — Stripe signature validation needs it
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  let event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch (err) {
    console.error('[Stripe webhook] Signature validation failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const stripeCustomerId = session.customer as string
        const userId = session.metadata?.userId

        if (!userId || !stripeCustomerId) break

        const status = await getSubscriptionStatus(stripeCustomerId)
        if (!status) break

        await updateSubscription(
          supabaseAdmin,
          userId,
          status.tier,
          status.expiresAt
        )
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const stripeCustomerId = subscription.customer as string

        const user = await getUserByStripeId(supabaseAdmin, stripeCustomerId)
        if (!user) break

        // Subscription cancelled — downgrade to free
        await updateSubscription(supabaseAdmin, user.id, 'free', null)
        break
      }

      // Add more cases here as needed (renewal, upgrade, etc.)
      default:
        // Silently ignore unhandled events
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Stripe webhook] Handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
