/**
 * run-scrapers.ts — Scraper orchestration job
 *
 * Runs all configured scrapers, normalises their results, upserts movies,
 * and inserts download/stream links. Each scraper is isolated — if one
 * fails, the others continue.
 *
 * Called by: /api/cron/run-scrapers (every 12 hours)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { upsertMovie, insertDownloadLinks } from '@flixaura/db'
import {
  getNetNaijaListingLinks,
  scrapeNetNaijaItem,
  getO2TvListingLinks,
  scrapeO2TvItem,
  normaliseScrapedItem,
  type ScrapedItem,
} from './scrapers'
import type { RunCounters } from './log'

const MAX_ITEMS_PER_SOURCE = 15 // keeps each run short and polite to source sites

export async function runScrapers(client: SupabaseClient): Promise<RunCounters> {
  const counters: RunCounters = {
    items_found: 0,
    items_added: 0,
    items_updated: 0,
    items_skipped: 0,
  }

  // ─── NetNaija — Nollywood ────────────────────────────────────────────────
  await runSource(
    client,
    counters,
    'nollywood',
    async () => {
      const links = await getNetNaijaListingLinks()
      const items: ScrapedItem[] = []
      for (const link of links.slice(0, MAX_ITEMS_PER_SOURCE)) {
        const item = await scrapeNetNaijaItem(link)
        if (item) items.push(item)
        await sleep(300) // be polite — don't hammer the source site
      }
      return items
    }
  )

  // ─── O2TVSeries — African series ────────────────────────────────────────
  await runSource(
    client,
    counters,
    'african',
    async () => {
      const links = await getO2TvListingLinks()
      const items: ScrapedItem[] = []
      for (const link of links.slice(0, MAX_ITEMS_PER_SOURCE)) {
        const item = await scrapeO2TvItem(link)
        if (item) items.push(item)
        await sleep(300)
      }
      return items
    }
  )

  return counters
}

/**
 * Runs a single scraper source, normalises results, and upserts to DB.
 * Wrapped in try/catch so one source's failure doesn't stop the others.
 */
async function runSource(
  client: SupabaseClient,
  counters: RunCounters,
  region: 'nollywood' | 'african',
  fetchItems: () => Promise<ScrapedItem[]>
): Promise<void> {
  let items: ScrapedItem[] = []

  try {
    items = await fetchItems()
  } catch (err) {
    console.error(`Scraper source "${region}" failed entirely:`, err)
    return
  }

  counters.items_found += items.length

  for (const item of items) {
    try {
      // Skip items with no usable links — nothing for users to click
      if (item.links.length === 0) {
        counters.items_skipped++
        continue
      }

      const normalised = normaliseScrapedItem(item, region)

      const existing = await client
        .from('movies')
        .select('id')
        .eq('slug', normalised.slug)
        .single()

      const movie = await upsertMovie(client, normalised)

      await insertDownloadLinks(
        client,
        movie.id,
        item.links.map((l) => ({
          url: l.url,
          quality: l.quality,
          format: l.format,
          source: item.source,
        }))
      )

      if (existing.data) {
        counters.items_updated++
      } else {
        counters.items_added++
      }
    } catch (err) {
      console.error(`Failed to process scraped item "${item.title}":`, err)
      counters.items_skipped++
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
