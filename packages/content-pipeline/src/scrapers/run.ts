import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from '@flixaura/db';

async function scrapeTarget(target: { id: string; name: string; base_url: string }) {
  const startLog = await supabase
    .from('scraper_log')
    .insert({ source_id: target.id, source_type: 'scrape', status: 'running' })
    .select()
    .single();

  let itemsFound = 0;
  let itemsFailed = 0;

  try {
    const res = await axios.get(target.base_url);
    const $ = cheerio.load(res.data);

    // NOTE: selectors below are placeholders — adjust per site structure
    $('.post-item').each((_, el) => {
      try {
        const title = $(el).find('.title').text().trim();
        const link = $(el).find('a').attr('href');
        if (title && link) {
          itemsFound++;
          // queue for normalisation — handled separately
        }
      } catch {
        itemsFailed++;
      }
    });

    await supabase
      .from('scraper_log')
      .update({ status: 'completed', items_found: itemsFound, items_failed: itemsFailed, finished_at: new Date().toISOString() })
      .eq('id', startLog.data?.id);

    console.log(`${target.name}: found ${itemsFound}, failed ${itemsFailed}`);
  } catch (err) {
    await supabase
      .from('scraper_log')
      .update({ status: 'failed', finished_at: new Date().toISOString() })
      .eq('id', startLog.data?.id);
    console.error(`Scrape failed for ${target.name}:`, err);
  }
}

async function runScrapers() {
  const { data: targets } = await supabase
    .from('scrape_targets')
    .select('*')
    .eq('active', true);

  if (!targets) return;

  for (const target of targets) {
    await scrapeTarget(target);
  }
}

runScrapers().catch(console.error);
