import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import * as fs from 'fs';
import { searchVideos } from './client';

const QUERIES: { query: string; region: string; contentType: string }[] = [
  { query: 'Nollywood full movie 2024', region: 'nollywood', contentType: 'movie' },
  { query: 'Yoruba movie full', region: 'nollywood', contentType: 'movie' },
  { query: 'Royal Arts Academy full movie', region: 'nollywood', contentType: 'movie' },
  { query: 'Dharmann short film', region: 'hollywood', contentType: 'movie' },
];

const OUTPUT_PATH = path.resolve(__dirname, 'data/candidates.json');

async function runSearch() {
  // Merge into any existing file rather than overwrite — preserves
  // previously reviewed "approved" decisions on re-runs.
  const existing: any[] = fs.existsSync(OUTPUT_PATH)
    ? JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'))
    : [];
  const byVideoId = new Map(existing.map((c) => [c.videoId, c]));

  for (const { query, region, contentType } of QUERIES) {
    console.log(`Searching: ${query}`);
    const results = await searchVideos(query, 10);

    for (const r of results as any[]) {
      if (byVideoId.has(r.videoId)) continue; // don't clobber existing review decisions
      byVideoId.set(r.videoId, { ...r, query, region, contentType, approved: false });
    }
  }

  const allResults = [...byVideoId.values()];

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allResults, null, 2));

  console.log(`Wrote ${allResults.length} candidates to ${OUTPUT_PATH}`);
  console.log('Open candidates.json, review each entry, and set "approved": true for the ones you want.');
}

runSearch().catch(console.error);
