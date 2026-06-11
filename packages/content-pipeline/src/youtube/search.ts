import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { google } from 'googleapis';
import * as fs from 'fs';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

interface SearchTarget {
  query: string;
  region: string;
  contentType: 'movie' | 'series';
}

const SEARCH_TARGETS: SearchTarget[] = [
  { query: 'Nollywood Movies official full movie 2024', region: 'nollywood', contentType: 'movie' },
  { query: 'Yoruba Blockbusters official full movie', region: 'nollywood', contentType: 'movie' },
];

async function searchYoutube() {
  const candidates: any[] = [];

  for (const target of SEARCH_TARGETS) {
    console.log(`Searching: ${target.query}`);

    const res = await youtube.search.list({
      part: ['snippet'],
      q: target.query,
      type: ['video'],
      maxResults: 10,
      videoDuration: 'long', // filters out shorts/trailers, favors full-length
    });

    const items = res.data.items || [];

    for (const item of items) {
      candidates.push({
        title: item.snippet?.title,
        channel: item.snippet?.channelTitle,
        videoId: item.id?.videoId,
        description: item.snippet?.description,
        publishedAt: item.snippet?.publishedAt,
        thumbnail: item.snippet?.thumbnails?.medium?.url,
        region: target.region,
        contentType: target.contentType,
        approved: false, // you set this to true after reviewing
      });
    }
  }

  const outputPath = path.resolve(__dirname, 'data/candidates.json');
  fs.writeFileSync(outputPath, JSON.stringify(candidates, null, 2));
  console.log(`Found ${candidates.length} candidates. Saved to ${outputPath}`);
  console.log('Open the file, set "approved": true for items you want to add, then run npm run sync:youtube:approve');
}

searchYoutube().catch(console.error);
