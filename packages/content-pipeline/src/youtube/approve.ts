import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import * as fs from 'fs';
import { getServerClient, upsertYoutubeEmbed } from '@flixaura/db';
import { slugify } from '@flixaura/shared';

interface Candidate {
  videoId: string;
  title: string;
  channel: string;
  description: string;
  region: string;
  contentType: string;
  kind?: 'full_movie' | 'recap';
  approved: boolean;
}

function decodeHtml(str: string): string {
  return str
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// Titles usually carry a 4-digit release year — fall back to the current
// year when one can't be found (movies.year is NOT NULL).
function extractYear(title: string): number {
  const match = title.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : new Date().getFullYear();
}

async function approveAndImport() {
  const filePath = path.resolve(__dirname, 'data/candidates.json');
  const candidates: Candidate[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const supabase = getServerClient();

  const approved = candidates.filter((c) => c.approved);
  console.log(`Importing ${approved.length} approved videos...`);

  for (const c of approved) {
    const title = decodeHtml(c.title);
    const slug = slugify(title);

    const { data: movie, error } = await supabase
      .from('movies')
      .upsert(
        {
          title,
          slug,
          synopsis: decodeHtml(c.description).slice(0, 500),
          content_type: c.contentType,
          region: c.region,
          year: extractYear(title),
        },
        { onConflict: 'slug' }
      )
      .select()
      .single();

    if (error) {
      console.error(`Failed for "${title}":`, error.message);
      continue;
    }

    if (movie) {
      // Candidates from before the `kind` field existed are all full movies
      // (the recap categories were added afterward).
      const isRecap = c.kind === 'recap';

      await upsertYoutubeEmbed(supabase, {
        movie_id: movie.id,
        youtube_video_id: c.videoId,
        is_official_trailer: false,
        is_full_content: !isRecap,
        is_recap: isRecap,
      });
      console.log(`Imported (${isRecap ? 'recap' : 'full movie'}): ${title}`);
    }
  }
}

approveAndImport().catch(console.error);
