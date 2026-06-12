import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import * as fs from 'fs';
import { supabase, addYoutubeEmbed } from '@flixaura/db';

interface Candidate {
  videoId: string;
  title: string;
  channel: string;
  description: string;
  region: string;
  content_type: string;
  approved: boolean;
}

async function approveAndImport() {
  const filePath = path.resolve(__dirname, '../../candidates.json');
  const candidates: Candidate[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const approved = candidates.filter(c => c.approved);
  console.log(`Importing ${approved.length} approved videos...`);

  for (const c of approved) {
    const { data: movie, error } = await supabase
      .from('movies')
      .upsert({
        title: c.title,
        overview: c.description.slice(0, 500),
        content_type: c.content_type,
        region: c.region,
      }, { onConflict: 'title' })
      .select()
      .single();

    if (error) {
      console.error(`Failed for "${c.title}":`, error.message);
      continue;
    }

    if (movie) {
      await addYoutubeEmbed(movie.id, c.videoId, true);
      console.log(`Imported: ${c.title}`);
    }
  }
}
function decodeHtml(str: string): string {
  return str
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
approveAndImport().catch(console.error);
