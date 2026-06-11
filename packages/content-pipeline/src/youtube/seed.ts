import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { supabase, addYoutubeEmbed } from '@flixaura/db';

const SEED_ENTRIES = [
  {
    title: 'Example Nollywood Film Title',
    youtube_video_id: 'REPLACE_WITH_REAL_VIDEO_ID',
    region: 'nollywood',
    content_type: 'movie',
  },
];

async function seedYoutube() {
  for (const entry of SEED_ENTRIES) {
    const { data: movie } = await supabase
      .from('movies')
      .upsert({
        title: entry.title,
        content_type: entry.content_type,
        region: entry.region,
      }, { onConflict: 'title' })
      .select()
      .single();

    if (movie) {
      await addYoutubeEmbed(movie.id, entry.youtube_video_id, true);
      console.log(`Added embed for: ${entry.title}`);
    }
  }
}

seedYoutube().catch(console.error);
