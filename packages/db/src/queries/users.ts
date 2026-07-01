/**
 * users.ts — Database queries for user profiles, watchlists, and interactions.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { User, UserInteraction, SubscriptionTier } from '@flixaura/shared'

// ─── PROFILE ──────────────────────────────────────────────────────────────────

/**
 * Get a user's profile by their auth ID.
 */
export async function getProfile(
  client: SupabaseClient,
  userId: string
): Promise<User | null> {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getProfile failed: ${error.message}`)
  }

  return data as User
}

/**
 * Update a user's display name or avatar.
 */
export async function updateProfile(
  client: SupabaseClient,
  userId: string,
  updates: Partial<Pick<User, 'display_name' | 'avatar_url'>>
): Promise<User> {
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw new Error(`updateProfile failed: ${error.message}`)

  return data as User
}

/**
 * Update a user's subscription tier and expiry.
 * Called by the Stripe webhook handler after payment succeeds.
 */
export async function updateSubscription(
  client: SupabaseClient,
  userId: string,
  tier: SubscriptionTier,
  expiresAt: string | null
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_expires_at: expiresAt,
    })
    .eq('id', userId)

  if (error) throw new Error(`updateSubscription failed: ${error.message}`)
}

/**
 * Store the Stripe customer ID on a user's profile.
 * Called when a Stripe customer is first created for a user.
 */
export async function setStripeCustomerId(
  client: SupabaseClient,
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({ stripe_customer_id: stripeCustomerId })
    .eq('id', userId)

  if (error) throw new Error(`setStripeCustomerId failed: ${error.message}`)
}

/**
 * Look up a user by their Stripe customer ID.
 * Used in the webhook to identify which user a payment belongs to.
 */
export async function getUserByStripeId(
  client: SupabaseClient,
  stripeCustomerId: string
): Promise<User | null> {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`getUserByStripeId failed: ${error.message}`)
  }

  return data as User
}

// ─── WATCHLIST ────────────────────────────────────────────────────────────────

/**
 * Get all movies in a user's watchlist, with full movie data joined.
 */
export async function getWatchlist(
  client: SupabaseClient,
  userId: string
): Promise<Array<UserInteraction & { movie: any }>> {
  const { data, error } = await client
    .from('user_interactions')
    .select('*, movie:movies(*, download_links(*))')
    .eq('user_id', userId)
    .eq('in_watchlist', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getWatchlist failed: ${error.message}`)

  return (data ?? []) as Array<UserInteraction & { movie: any }>
}

/**
 * Add a movie to a user's watchlist.
 * Uses upsert so calling it twice on the same movie is safe.
 */
export async function addToWatchlist(
  client: SupabaseClient,
  userId: string,
  movieId: string
): Promise<void> {
  const { error } = await client
    .from('user_interactions')
    .upsert(
      { user_id: userId, movie_id: movieId, in_watchlist: true },
      { onConflict: 'user_id,movie_id' }
    )

  if (error) throw new Error(`addToWatchlist failed: ${error.message}`)
}

/**
 * Remove a movie from a user's watchlist.
 */
export async function removeFromWatchlist(
  client: SupabaseClient,
  userId: string,
  movieId: string
): Promise<void> {
  const { error } = await client
    .from('user_interactions')
    .update({ in_watchlist: false })
    .eq('user_id', userId)
    .eq('movie_id', movieId)

  if (error) throw new Error(`removeFromWatchlist failed: ${error.message}`)
}

/**
 * Check if a specific movie is in a user's watchlist.
 */
export async function isInWatchlist(
  client: SupabaseClient,
  userId: string,
  movieId: string
): Promise<boolean> {
  const { data, error } = await client
    .from('user_interactions')
    .select('in_watchlist')
    .eq('user_id', userId)
    .eq('movie_id', movieId)
    .single()

  if (error) return false
  return data?.in_watchlist ?? false
}

// ─── WATCH HISTORY ────────────────────────────────────────────────────────────

/**
 * Get a user's watch history, most recent first.
 */
export async function getWatchHistory(
  client: SupabaseClient,
  userId: string,
  limit = 20
): Promise<Array<UserInteraction & { movie: any }>> {
  const { data, error } = await client
    .from('user_interactions')
    .select('*, movie:movies(id, title, slug, poster_url, region, year)')
    .eq('user_id', userId)
    .eq('watched', true)
    .order('watched_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`getWatchHistory failed: ${error.message}`)

  return (data ?? []) as Array<UserInteraction & { movie: any }>
}

/**
 * Mark a movie as watched for a user.
 */
export async function markAsWatched(
  client: SupabaseClient,
  userId: string,
  movieId: string
): Promise<void> {
  const { error } = await client
    .from('user_interactions')
    .upsert(
      {
        user_id: userId,
        movie_id: movieId,
        watched: true,
        watched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,movie_id' }
    )

  if (error) throw new Error(`markAsWatched failed: ${error.message}`)
}

/**
 * Save a user's rating for a movie (1–10 scale).
 */
export async function rateMovie(
  client: SupabaseClient,
  userId: string,
  movieId: string,
  rating: number
): Promise<void> {
  const { error } = await client
    .from('user_interactions')
    .upsert(
      { user_id: userId, movie_id: movieId, user_rating: rating },
      { onConflict: 'user_id,movie_id' }
    )

  if (error) throw new Error(`rateMovie failed: ${error.message}`)
}

/**
 * Get all movie IDs a user has interacted with.
 * Used by the AI recommendation engine to avoid re-recommending watched content.
 */
export async function getUserMovieIds(
  client: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await client
    .from('user_interactions')
    .select('movie_id')
    .eq('user_id', userId)

  if (error) throw new Error(`getUserMovieIds failed: ${error.message}`)

  return (data ?? []).map((row) => row.movie_id as string)
}
