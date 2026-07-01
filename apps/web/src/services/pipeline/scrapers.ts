/**
 * scrapers.ts — Site-specific scrapers for Kenyan/Nollywood content
 *
 * Each scraper follows the same shape:
 *   1. Fetch a listing page
 *   2. Extract movie title + detail page links
 *   3. Visit each detail page, extract metadata + download/stream links
 *   4. Return ScrapedItem[] for the pipeline to normalise and upsert
 *
 * IMPORTANT — selectors are PLACEHOLDERS (marked with TODO).
 * Inspect each site's actual HTML structure in your browser DevTools
 * and replace the selectors before running this in production.
 *
 * Each scraper is independent — if one site changes its HTML and breaks,
 * the others keep working. Wrap each in try/catch at the call site.
 */

import * as cheerio from 'cheerio'
import { slugify } from '@flixaura/shared'
import type { LinkType, Quality, Format } from '@flixaura/shared'

export interface ScrapedItem {
  title: string
  year: number | null
  poster_url: string | null
  synopsis: string | null
  source: string
  links: Array<{
    url: string
    quality: Quality
    format: Format
    link_type: LinkType
  }>
}

const USER_AGENT = 'FlixAuraBot/1.0 (content indexer; contact: hello@flix-aura.com)'

async function fetchHtml(url: string, timeoutMs = 12000): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    })
    if (!res.ok) return null
    return await res.text()
  } catch (err) {
    console.warn(`fetchHtml failed for ${url}:`, err)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Detect quality from link text/href — shared across scrapers.
 */
function detectQuality(text: string): Quality {
  const t = text.toLowerCase()
  if (t.includes('4k') || t.includes('2160')) return '4K'
  if (t.includes('1080') || t.includes('fhd')) return 'HD'
  if (t.includes('720')) return '720p'
  if (t.includes('480')) return '480p'
  if (t.includes('3gp')) return '3GP'
  return '360p'
}

/**
 * Detect file format from a URL — shared across scrapers.
 */
function detectFormat(url: string): Format {
  const match = url.match(/\.(mkv|mp4|avi|3gp|webm)/i)
  return (match?.[1]?.toUpperCase() as Format) ?? 'MP4'
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRAPER 1 — NetNaija (Nollywood + Hollywood mirrors)
// ─────────────────────────────────────────────────────────────────────────────

const NETNAIJA_BASE = 'https://netnaija.com'

/**
 * Scrape the NetNaija "latest movies" listing page for detail page links.
 */
export async function getNetNaijaListingLinks(page = 1): Promise<string[]> {
  const html = await fetchHtml(`${NETNAIJA_BASE}/videos/movies/page/${page}/`)
  if (!html) return []

  const $ = cheerio.load(html)
  const links: string[] = []

  // TODO: verify this selector against the live site's current HTML.
  // Inspect a movie card on netnaija.com and confirm the class name.
  $('.video-box a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (href?.includes('/videos/')) {
      links.push(href.startsWith('http') ? href : `${NETNAIJA_BASE}${href}`)
    }
  })

  return [...new Set(links)]
}

/**
 * Scrape a single NetNaija movie detail page.
 */
export async function scrapeNetNaijaItem(url: string): Promise<ScrapedItem | null> {
  const html = await fetchHtml(url)
  if (!html) return null

  const $ = cheerio.load(html)

  // TODO: verify these selectors — titles/descriptions on NetNaija
  // are typically in h1.video-title or h1.post-title
  const rawTitle = $('h1.video-title, h1.post-title').first().text().trim()
  if (!rawTitle) return null

  const yearMatch = rawTitle.match(/\((\d{4})\)/)
  const year = yearMatch ? parseInt(yearMatch[1]!) : null
  const title = rawTitle.replace(/\(\d{4}\)/, '').trim()

  const synopsis = $('.video-description p, .post-content p').first().text().trim() || null
  const poster_url = $('meta[property="og:image"]').attr('content') ?? null

  const links: ScrapedItem['links'] = []

  // TODO: NetNaija download buttons are typically <a> tags with
  // href ending in video extensions, or text containing "Download"
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const text = $(el).text().trim()

    const looksLikeDownload =
      /\.(mkv|mp4|avi|3gp|webm)(\?|$)/i.test(href) || /download/i.test(text)

    if (!looksLikeDownload) return

    links.push({
      url: href,
      quality: detectQuality(text + href),
      format: detectFormat(href),
      link_type: 'download',
    })
  })

  return {
    title,
    year,
    poster_url,
    synopsis,
    source: 'netnaija',
    links,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRAPER 2 — O2TVSeries (Series-focused)
// ─────────────────────────────────────────────────────────────────────────────

const O2TV_BASE = 'https://o2tvseries.com'

/**
 * Scrape O2TVSeries "latest updates" listing page for detail page links.
 */
export async function getO2TvListingLinks(): Promise<string[]> {
  const html = await fetchHtml(`${O2TV_BASE}/`)
  if (!html) return []

  const $ = cheerio.load(html)
  const links: string[] = []

  // TODO: verify selector — O2TVSeries lists shows in a table/list on the homepage
  $('a[href*="/show/"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) {
      links.push(href.startsWith('http') ? href : `${O2TV_BASE}${href}`)
    }
  })

  return [...new Set(links)].slice(0, 20)
}

/**
 * Scrape a single O2TVSeries show page.
 */
export async function scrapeO2TvItem(url: string): Promise<ScrapedItem | null> {
  const html = await fetchHtml(url)
  if (!html) return null

  const $ = cheerio.load(html)

  // TODO: verify selector for show title
  const title = $('h1, .show-title').first().text().trim()
  if (!title) return null

  const synopsis = $('.show-description, .synopsis').first().text().trim() || null
  const poster_url = $('meta[property="og:image"]').attr('content') ?? null

  const links: ScrapedItem['links'] = []

  // TODO: verify selector for episode download/stream links
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const text = $(el).text().trim()

    if (/\.(mkv|mp4|avi|3gp)(\?|$)/i.test(href)) {
      links.push({
        url: href,
        quality: detectQuality(text + href),
        format: detectFormat(href),
        link_type: 'download',
      })
    } else if (/watch|stream/i.test(text)) {
      links.push({
        url: href,
        quality: detectQuality(text),
        format: 'MP4',
        link_type: 'stream',
      })
    }
  })

  return {
    title,
    year: null, // series often span multiple years — left null intentionally
    poster_url,
    synopsis,
    source: 'o2tvseries',
    links,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — convert a ScrapedItem into the movies table insert shape
// ─────────────────────────────────────────────────────────────────────────────

export function normaliseScrapedItem(
  item: ScrapedItem,
  region: 'nollywood' | 'african'
): Omit<any, 'id' | 'created_at' | 'updated_at' | 'download_links'> {
  const year = item.year ?? new Date().getFullYear()

  return {
    tmdb_id: null,
    title: item.title,
    slug: slugify(`${item.title}-${year}`),
    region,
    content_type: item.links.some((l) => l.link_type === 'stream') ? 'series' : 'movie',
    genres: [],
    year,
    runtime_minutes: null,
    synopsis: item.synopsis,
    poster_url: item.poster_url,
    backdrop_url: null,
    language: region === 'nollywood' ? 'en' : 'sw',
    country_origin: region === 'nollywood' ? 'NG' : 'KE',
    rating: null,
    rating_count: 0,
    is_series: item.links.some((l) => l.link_type === 'stream'),
    season_count: null,
    episode_count: null,
    has_subtitle_en: true,
    has_subtitle_sw: region === 'african',
    has_subtitle_yo: region === 'nollywood',
    ai_tags: [],
    mood_tags: [],
    source_priority: 1, // scraped sources are lower trust than TMDB
  }
}
