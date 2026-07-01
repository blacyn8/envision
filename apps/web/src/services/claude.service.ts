/**
 * claude.ts — Anthropic Claude API helpers
 *
 * All LLM-powered features live here:
 * - Natural language search interpretation
 * - Personalised movie recommendations
 * - AI synopsis generation
 * - Content tagging
 * - Subtitle translation
 *
 * Server-only. Never import in client components.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { Movie, MovieFilters } from '@flixaura/shared'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MODEL = 'claude-sonnet-4-20250514'

// ─── Natural language search ──────────────────────────────────────────────────

/**
 * Takes a free-text user query like "show me sad Korean romance from 2022"
 * and returns structured MovieFilters + a plain-English interpretation.
 */
export async function interpretSearchQuery(query: string): Promise<{
  filters: MovieFilters
  interpretation: string
}> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a movie search assistant for Flix-Aura, a platform with Hollywood, Nollywood, KDrama, Bollywood, Anime, and African content.

Given a natural language search query, extract structured filters and respond ONLY with a JSON object in this exact shape:
{
  "filters": {
    "region": "hollywood" | "nollywood" | "kdrama" | "bollywood" | "anime" | "african" | null,
    "genre": "action" | "romance" | "thriller" | "comedy" | "horror" | "sci-fi" | "drama" | "animation" | "documentary" | "fantasy" | null,
    "year": number | null,
    "content_type": "movie" | "series" | "anime" | null,
    "query": "remaining keyword string or null"
  },
  "interpretation": "One friendly sentence explaining what you understood from the query"
}

Rules:
- KDrama = Korean drama series. Korean movies = kdrama region too.
- Anime is always region "anime", content_type "anime".
- Nollywood = Nigerian films. African TV = broader African content.
- "sad" / "emotional" / "cry" → genre "drama" or "romance"
- "scary" / "creepy" → genre "horror"
- "funny" / "laugh" → genre "comedy"
- If no clear match for a field, use null.
- Never include any text outside the JSON object.`,
    messages: [{ role: 'user', content: query }],
  })

  const text = message.content[0]?.type === 'text' ? message.content[0].text : '{}'

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return {
      filters: parsed.filters ?? {},
      interpretation: parsed.interpretation ?? query,
    }
  } catch {
    // Graceful fallback — treat the whole query as a keyword search
    return {
      filters: { query },
      interpretation: `Searching for "${query}"`,
    }
  }
}

// ─── Personalised recommendations ────────────────────────────────────────────

/**
 * Given a user's watch history titles and genres, suggest movie titles.
 * Returns an array of title strings to then look up in the DB.
 */
export async function getAiRecommendations(input: {
  watchedTitles: string[]
  preferredGenres: string[]
  preferredRegions: string[]
  excludeTitles: string[]
}): Promise<string[]> {
  const { watchedTitles, preferredGenres, preferredRegions, excludeTitles } = input

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are a movie recommendation engine for Flix-Aura. Recommend movies and series the user will enjoy based on their watch history.
Respond ONLY with a JSON array of exactly 10 title strings. No explanation, no markdown, just the array.
Example: ["Title One", "Title Two", ...]`,
    messages: [
      {
        role: 'user',
        content: `
Watched: ${watchedTitles.slice(0, 10).join(', ') || 'nothing yet'}
Preferred genres: ${preferredGenres.join(', ') || 'any'}
Preferred regions: ${preferredRegions.join(', ') || 'any'}
Do NOT recommend: ${excludeTitles.slice(0, 10).join(', ') || 'nothing to exclude'}

Recommend 10 titles they would enjoy. Include a mix of their preferred regions.`,
      },
    ],
  })

  const text = message.content[0]?.type === 'text' ? message.content[0].text : '[]'

  try {
    const titles = JSON.parse(text.replace(/```json|```/g, '').trim())
    return Array.isArray(titles) ? titles.slice(0, 10) : []
  } catch {
    return []
  }
}

// ─── Synopsis writer ──────────────────────────────────────────────────────────

/**
 * Generate a compelling synopsis for a movie when none exists.
 * Used by the scraper for Nollywood/African titles with missing metadata.
 */
export async function writeSynopsis(movie: {
  title: string
  year: number
  region: string
  genres: string[]
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: `You write short, engaging movie synopses for a streaming discovery platform. 
Write 2–3 sentences. Be factual in tone, not promotional. 
Do not use phrases like "a gripping tale" or "an unforgettable journey".`,
    messages: [
      {
        role: 'user',
        content: `Write a synopsis for: "${movie.title}" (${movie.year}), ${movie.region}, genres: ${movie.genres.join(', ')}.`,
      },
    ],
  })

  return message.content[0]?.type === 'text'
    ? message.content[0].text.trim()
    : ''
}

// ─── Content tagger ───────────────────────────────────────────────────────────

/**
 * Generate mood/trope tags for a movie from its synopsis.
 * Tags like: "slow burn", "revenge plot", "enemies to lovers", "political thriller"
 */
export async function tagContent(movie: {
  title: string
  synopsis: string
  genres: string[]
}): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: `You generate short discovery tags for movies on a streaming platform.
Respond ONLY with a JSON array of 4–8 lowercase tag strings.
Focus on mood, tropes, themes, and tone — not genre (those are handled separately).
Examples: ["slow burn", "revenge", "twist ending", "enemies to lovers", "political conspiracy"]
No markdown, no explanation — just the JSON array.`,
    messages: [
      {
        role: 'user',
        content: `Title: ${movie.title}
Synopsis: ${movie.synopsis}
Genres: ${movie.genres.join(', ')}`,
      },
    ],
  })

  const text = message.content[0]?.type === 'text' ? message.content[0].text : '[]'

  try {
    const tags = JSON.parse(text.replace(/```json|```/g, '').trim())
    return Array.isArray(tags) ? tags.slice(0, 8) : []
  } catch {
    return []
  }
}

// ─── Subtitle translator ──────────────────────────────────────────────────────

/**
 * Translate a subtitle snippet into a target language.
 * Used for Swahili and Yoruba subtitle generation from English source.
 */
export async function translateSubtitle(
  text: string,
  targetLanguage: 'Swahili' | 'Yoruba' | 'French' | 'Portuguese'
): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You translate movie subtitle text accurately. 
Preserve the timing feel of subtitles — keep translations concise.
Respond with only the translated text, no explanations.`,
    messages: [
      {
        role: 'user',
        content: `Translate to ${targetLanguage}:\n\n${text}`,
      },
    ],
  })

  return message.content[0]?.type === 'text'
    ? message.content[0].text.trim()
    : text
}

// ─── Movie discovery chatbot ──────────────────────────────────────────────────

/**
 * Conversational movie discovery.
 * Takes a conversation history and returns the assistant's next message
 * along with any movie title suggestions extracted from the response.
 */
export async function chatDiscover(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ reply: string; suggestedTitles: string[] }> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: `You are Flix-Aura's movie discovery assistant. Help users find movies and series to watch.
You have access to Hollywood, Nollywood, KDrama, Bollywood, Anime, and African TV content.

When you recommend specific titles, wrap each title in [[double brackets]] so they can be extracted.
Example: "You might enjoy [[Parasite]] or [[Train to Busan]] — both are Korean with great suspense."

Keep responses concise (2–4 sentences). Be conversational and enthusiastic about film.`,
    messages,
  })

  const reply =
    response.content[0]?.type === 'text' ? response.content[0].text.trim() : ''

  // Extract [[Title]] patterns from the reply
  const titleMatches = reply.match(/\[\[([^\]]+)\]\]/g) ?? []
  const suggestedTitles = titleMatches.map((m) => m.replace(/\[\[|\]\]/g, ''))

  // Clean the reply for display — remove the brackets
  const cleanReply = reply.replace(/\[\[([^\]]+)\]\]/g, '$1')

  return { reply: cleanReply, suggestedTitles }
}
