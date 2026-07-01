/**
 * link-checker.ts — Verifies download/stream links are still alive
 *
 * Scraped links go dead frequently — source files get removed, hosts
 * shut down, etc. This job periodically HEAD-requests each link and
 * marks it inactive after repeated failures, so users never click a
 * dead link.
 *
 * Called by: /api/cron/check-links (recommended: daily)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { RunCounters } from './log'

const MAX_FAILURES_BEFORE_DEACTIVATE = 3
const CHECK_BATCH_SIZE = 50 // links to check per run — keeps runs fast
const CHECK_TIMEOUT_MS = 8000

export async function runLinkCheck(client: SupabaseClient): Promise<RunCounters> {
  const counters: RunCounters = {
    items_found: 0,
    items_added: 0,    // unused for this job
    items_updated: 0,  // links marked active again
    items_skipped: 0,  // links marked inactive
  }

  // Get the oldest-checked active links first
  const { data: links, error } = await client
    .from('download_links')
    .select('id, url, check_failures')
    .eq('is_active', true)
    .order('last_checked', { ascending: true, nullsFirst: true })
    .limit(CHECK_BATCH_SIZE)

  if (error) throw new Error(`runLinkCheck failed to fetch links: ${error.message}`)

  counters.items_found = links?.length ?? 0

  for (const link of links ?? []) {
    const isAlive = await checkUrl(link.url)
    const now = new Date().toISOString()

    if (isAlive) {
      await client
        .from('download_links')
        .update({ last_checked: now, check_failures: 0 })
        .eq('id', link.id)
      counters.items_updated++
    } else {
      const newFailures = (link.check_failures ?? 0) + 1
      const shouldDeactivate = newFailures >= MAX_FAILURES_BEFORE_DEACTIVATE

      await client
        .from('download_links')
        .update({
          last_checked: now,
          check_failures: newFailures,
          is_active: !shouldDeactivate,
        })
        .eq('id', link.id)

      if (shouldDeactivate) counters.items_skipped++
    }
  }

  return counters
}

/**
 * HEAD request to check if a URL is still reachable.
 * Falls back to GET if the server doesn't support HEAD.
 */
async function checkUrl(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)

  try {
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal })

    // Some servers reject HEAD — retry with a ranged GET (just first byte)
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: controller.signal,
      })
    }

    return res.ok || res.status === 206 // 206 = partial content (range request worked)
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}
