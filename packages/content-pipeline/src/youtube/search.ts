import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import * as fs from 'fs';
import { searchVideos } from './client';

const QUERIES = [
  'Nollywood full movie 2024',
  'Yoruba movie full',
  'Royal Arts Academy full movie',
];

async function runSearch() {
  const allResults: any[] = [];

  for (const query of QUERIES) {
    console.log(`Searching: ${query}`);
    const results = await searchVideos(query, 10);
   allResults.push(...results.map((r: any) => ({ ...r, query, region: 'nollywood', content_type: 'movie', approved: false })));
  }

  fs.writeFileSync(
    path.resolve(__dirname, '../../candidates.json'),
    JSON.stringify(allResults, null, 2)
  );

  console.log(`Wrote ${allResults.length} candidates to candidates.json`);
  console.log('Open candidates.json, review each entry, and set "approved": true for the ones you want.');
}

runSearch().catch(console.error);
