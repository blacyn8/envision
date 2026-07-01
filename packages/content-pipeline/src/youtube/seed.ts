import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import { getServerClient, upsertYoutubeEmbed } from '@flixaura/db';
import { slugify } from '@flixaura/shared';

const SEED_ENTRIES = [
  {
    title: 'Example Nollywood Film Title',
    year: new Date().getFullYear(),
    youtube_video_id: 'REPLACE_WITH_REAL_VIDEO_ID',
    region: 'nollywood',
    content_type: 'movie',
  },
];

async function seedYoutube() {
  const supabase = getServerClient();

  for (const entry of SEED_ENTRIES) {
    const { data: movie, error } = await supabase
      .from('movies')
      .upsert(
        {
          title: entry.title,
          slug: slugify(entry.title),
          content_type: entry.content_type,
          region: entry.region,
          year: entry.year,
        },
        { onConflict: 'slug' }
      )
      .select()
      .single();

    if (error) {
      console.error(`Failed for "${entry.title}":`, error.message);
      continue;
    }

    if (movie) {
      await upsertYoutubeEmbed(supabase, {
        movie_id: movie.id,
        youtube_video_id: entry.youtube_video_id,
        is_full_content: true,
      });
      console.log(`Added embed for: ${entry.title}`);
    }
  }
}

seedYoutube().catch(console.error);
