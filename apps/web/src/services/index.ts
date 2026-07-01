/**
 * services/index.ts — barrel export
 *
 * Each service file handles communication with ONE external system:
 *
 * tmdb.service.ts     → The Movie Database API (metadata, posters)
 * claude.service.ts   → Anthropic Claude API (AI search, recommendations)
 * stripe.service.ts   → Stripe API (subscriptions, billing)
 * pipeline/           → Cron job runners (TMDB sync, scrapers, link checks)
 *
 * Import individual services directly for better tree-shaking:
 *   import { searchTmdb } from '@/services/tmdb.service'
 *
 * Or import everything:
 *   import { searchTmdb } from '@/services'
 */

export * from './tmdb.service'
export * from './claude.service'
export * from './stripe.service'
