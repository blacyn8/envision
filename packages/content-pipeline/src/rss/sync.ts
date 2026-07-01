import * as dotenv from 'dotenv'; import * as path from 'path'; dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
import Parser from 'rss-parser';
import { getServerClient } from '@flixaura/db';
import { slugify } from '@flixaura/shared';

const parser = new Parser();

// Anime/KDrama release titles usually carry a 4-digit year somewhere —
// fall back to the current year when one can't be found (year is NOT NULL).
function extractYear(title: string): number {
  const match = title.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : new Date().getFullYear();
}

async function syncRSS() {
  console.log('Starting RSS sync...');
  const supabase = getServerClient();

  const { data: sources } = await supabase
    .from('rss_sources')
    .select('*')
    .eq('is_active', true);

  if (!sources) return;

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.feed_url);
      for (const item of feed.items.slice(0, 10)) {
        if (!item.title) continue;

        const { error } = await supabase.from('movies').upsert(
          {
            title: item.title,
            slug: slugify(item.title),
            synopsis: item.contentSnippet || null,
            content_type: 'series',
            region: source.region,
            year: extractYear(item.title),
          },
          { onConflict: 'slug', ignoreDuplicates: true }
        );

        if (error) console.error(`Failed to upsert "${item.title}":`, error.message);
      }

      await supabase
        .from('rss_sources')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', source.id);

      console.log(`Synced ${feed.items.length} items from ${source.name}`);
    } catch (err) {
      console.error(`Failed to sync ${source.name}:`, err);
    }
  }
}

syncRSS().catch(console.error);
