import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import * as fs from 'fs';
import { searchVideos } from './client';

type Kind = 'full_movie' | 'recap'

const QUERIES: { query: string; region: string; contentType: string; kind: Kind }[] = [
  { query: 'Nollywood full movie 2024', region: 'nollywood', contentType: 'movie', kind: 'full_movie' },
  { query: 'Yoruba movie full', region: 'nollywood', contentType: 'movie', kind: 'full_movie' },
  { query: 'Royal Arts Academy full movie', region: 'nollywood', contentType: 'movie', kind: 'full_movie' },

  // Dhar Mann-style — channels that write, produce, and own their own
  // short morality-tale films (not adaptations of anyone else's IP).
  { query: 'Dharmann short film', region: 'hollywood', contentType: 'movie', kind: 'full_movie' },
  { query: 'DramatizeMe short film', region: 'hollywood', contentType: 'movie', kind: 'full_movie' },
  { query: 'Totally Studios short film', region: 'hollywood', contentType: 'movie', kind: 'full_movie' },

  // Movie recap channels — third-party commentary/summary of someone
  // else's film. Never the full movie; imported as kind: 'recap' and
  // labeled as such in the UI.
  { query: 'Screen Rant movie recap', region: 'hollywood', contentType: 'movie', kind: 'recap' },
  { query: 'Movie Recaps channel', region: 'hollywood', contentType: 'movie', kind: 'recap' },
  { query: 'Movie Recapped channel', region: 'hollywood', contentType: 'movie', kind: 'recap' },
  { query: 'WhatCulture Movies recap', region: 'hollywood', contentType: 'movie', kind: 'recap' },
  { query: 'Horror Recaps channel', region: 'hollywood', contentType: 'movie', kind: 'recap' },
  { query: 'Film Recaps channel', region: 'hollywood', contentType: 'movie', kind: 'recap' },
  { query: 'RECAP KING channel', region: 'hollywood', contentType: 'movie', kind: 'recap' },
  { query: 'Recap Junkies channel', region: 'hollywood', contentType: 'movie', kind: 'recap' },
  { query: 'Man of Recaps channel', region: 'hollywood', contentType: 'movie', kind: 'recap' },
  { query: 'Scifi Recapped channel', region: 'hollywood', contentType: 'movie', kind: 'recap' },
  { query: 'Mystery Recapped channel', region: 'hollywood', contentType: 'movie', kind: 'recap' },
  { query: 'Cas van de Pol movie recap', region: 'hollywood', contentType: 'movie', kind: 'recap' },

  // Anime recap channels — same "recap, not the show" caveat applies.
  { query: 'Best Anime Recaps channel', region: 'anime', contentType: 'anime', kind: 'recap' },
  { query: 'AniCapped channel', region: 'anime', contentType: 'anime', kind: 'recap' },
  { query: 'AnHeavenRecaps channel', region: 'anime', contentType: 'anime', kind: 'recap' },
  { query: 'Anime Recap channel', region: 'anime', contentType: 'anime', kind: 'recap' },
  { query: 'Mr. Recap Animes channel', region: 'anime', contentType: 'anime', kind: 'recap' },
];

const OUTPUT_PATH = path.resolve(__dirname, 'data/candidates.json');

async function runSearch() {
  // Merge into any existing file rather than overwrite — preserves
  // previously reviewed "approved" decisions on re-runs.
  const existing: any[] = fs.existsSync(OUTPUT_PATH)
    ? JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'))
    : [];
  const byVideoId = new Map(existing.map((c) => [c.videoId, c]));

  for (const { query, region, contentType, kind } of QUERIES) {
    console.log(`Searching: ${query}`);
    const results = await searchVideos(query, 10);

    for (const r of results as any[]) {
      if (byVideoId.has(r.videoId)) continue; // don't clobber existing review decisions
      byVideoId.set(r.videoId, { ...r, query, region, contentType, kind, approved: false });
    }
  }

  const allResults = [...byVideoId.values()];

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allResults, null, 2));

  console.log(`Wrote ${allResults.length} candidates to ${OUTPUT_PATH}`);
  console.log('Open candidates.json, review each entry, and set "approved": true for the ones you want.');
}

runSearch().catch(console.error);
