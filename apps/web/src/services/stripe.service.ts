/**
 * stripe.ts — Stripe billing helpers
 *
 * Handles subscription checkout, customer management, and status checks.
 * Server-only. Never import in client components.
 */

import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// ─── Price IDs ───────────────────────────────────────────────────────────────
// Set these in your Stripe Dashboard → Products → Copy the price ID

export const PRICE_IDS = {
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY!,
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
} as const

// ─── Checkout ─────────────────────────────────────────────────────────────────

/**
 * Create a Stripe Checkout Session for a subscription.
 * Redirects the user to Stripe's hosted checkout page.
 */
export async function createCheckoutSession(input: {
  userId: string
  userEmail: string
  priceId: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  const { userId, userEmail, priceId, successUrl, cancelUrl } = input

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },  // passed back in the webhook
    subscription_data: {
      metadata: { userId },
    },
  })

  if (!session.url) throw new Error('Stripe session URL was not returned')

  return session.url
}

/**
 * Create a Stripe Customer Portal session.
 * Lets users manage their own subscription (cancel, upgrade, update card).
 */
export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })

  return session.url
}

// ─── Webhook validation ───────────────────────────────────────────────────────

/**
 * Validate and parse an incoming Stripe webhook event.
 * The raw request body and signature header are required.
 */
export function constructWebhookEvent(
  rawBody: string,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}

// ─── Subscription status ──────────────────────────────────────────────────────

/**
 * Get the current subscription status for a Stripe customer.
 * Returns null if no active subscription exists.
 */
export async function getSubscriptionStatus(stripeCustomerId: string): Promise<{
  tier: 'premium' | 'pro' | 'free'
  expiresAt: string | null
} | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 1,
  })

  const sub = subscriptions.data[0]
  if (!sub) return { tier: 'free', expiresAt: null }

  const priceId = sub.items.data[0]?.price.id
  const expiresAt = new Date(sub.current_period_end * 1000).toISOString()

  if (priceId === PRICE_IDS.pro_monthly) return { tier: 'pro', expiresAt }
  if (priceId === PRICE_IDS.premium_monthly) return { tier: 'premium', expiresAt }

  return { tier: 'free', expiresAt: null }
}
