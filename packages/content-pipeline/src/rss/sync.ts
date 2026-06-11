import Parser from 'rss-parser';
import { supabase } from '@flixaura/db';

const parser = new Parser();

async function syncRSS() {
  console.log('Starting RSS sync...');

  const { data: sources } = await supabase
    .from('rss_sources')
    .select('*')
    .eq('active', true);

  if (!sources) return;

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);
      for (const item of feed.items.slice(0, 10)) {
        await supabase.from('movies').upsert({
          title: item.title,
          overview: item.contentSnippet || '',
          source_url: item.link,
          content_type: 'series',
          region: source.category,
        }, { onConflict: 'title' });
      }
      console.log(`Synced ${feed.items.length} items from ${source.name}`);
    } catch (err) {
      console.error(`Failed to sync ${source.name}:`, err);
    }
  }
}

syncRSS().catch(console.error);
