/**
 * log.ts — Scraper/sync run logging
 *
 * Every pipeline job (TMDB sync, scrapers, RSS feeds) calls these helpers
 * to record its progress in the scraper_log table. This powers the future
 * admin dashboard and makes debugging failed runs straightforward.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface RunCounters {
  items_found: number
  items_added: number
  items_updated: number
  items_skipped: number
}

/**
 * Start a new scraper run. Returns the log row ID to update later.
 */
export async function startRun(
  client: SupabaseClient,
  sourceName: string
): Promise<string> {
  const { data, error } = await client
    .from('scraper_log')
    .insert({ source_name: sourceName, status: 'running' })
    .select('id')
    .single()

  if (error) throw new Error(`startRun failed: ${error.message}`)
  return data.id as string
}

/**
 * Mark a run as finished — success, partial, or failed.
 */
export async function finishRun(
  client: SupabaseClient,
  logId: string,
  status: 'success' | 'partial' | 'failed',
  counters: Partial<RunCounters>,
  errorMessage?: string
): Promise<void> {
  const { error } = await client
    .from('scraper_log')
    .update({
      finished_at: new Date().toISOString(),
      status,
      ...counters,
      error_message: errorMessage ?? null,
    })
    .eq('id', logId)

  if (error) throw new Error(`finishRun failed: ${error.message}`)
}

/**
 * Wraps a pipeline job with automatic start/finish logging and error handling.
 * Use this in every cron route so logging is consistent.
 *
 * Usage:
 *   const result = await withRunLogging(client, 'tmdb', async () => {
 *     // ... do work, return counters
 *     return { items_found: 10, items_added: 8, items_updated: 2, items_skipped: 0 }
 *   })
 */
export async function withRunLogging(
  client: SupabaseClient,
  sourceName: string,
  job: () => Promise<RunCounters>
): Promise<{ logId: string; status: string; counters: RunCounters }> {
  const logId = await startRun(client, sourceName)

  try {
    const counters = await job()
    const status = counters.items_skipped > 0 && counters.items_added === 0 ? 'partial' : 'success'
    await finishRun(client, logId, status, counters)
    return { logId, status, counters }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await finishRun(
      client,
      logId,
      'failed',
      { items_found: 0, items_added: 0, items_updated: 0, items_skipped: 0 },
      message
    )
    throw err
  }
}
