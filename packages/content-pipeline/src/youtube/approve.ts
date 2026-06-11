import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import * as fs from 'fs';
import { supabase, addYoutubeEmbed } from '@flixaura/db';

async function importApproved() {
  const filePath = path.resolve(__dirname, 'data/candidates.json');
  const candidates = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const approved = candidates.filter((c: any) => c.approved === true);

  if (approved.length === 0) {
    console.log('No approved items found. Edit candidates.json and set "approved": true on items you want.');
    return;
  }

  for (const item of approved) {
    const { data: movie, error } = await supabase
      .from('movies')
      .upsert({
        title: item.title,
        overview: item.description?.slice(0, 500) || '',
        content_type: item.contentType,
        region: item.region,
      }, { onConflict: 'title' })
      .select()
      .single();

    if (error) {
      console.error(`Error upserting ${item.title}:`, error.message);
      continue;
    }

    if (movie) {
      await addYoutubeEmbed(movie.id, item.videoId, true);
      console.log(`Imported: ${item.title} (${item.channel})`);
    }
  }

  console.log(`Done. Imported ${approved.length} items.`);
}

importApproved().catch(console.error);
