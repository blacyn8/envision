import 'dotenv/config';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../apps/web/.env.local') });
import 'dotenv/config';
import { fetchPopularMovies, fetchPopularTV } from './client';
import { supabase } from '@flixaura/db';

async function syncTMDB() {
  console.log('Starting TMDB sync...');

  const movies = await fetchPopularMovies(1);
for (const m of movies) {
  const { error } = await supabase.from('movies').upsert({
    tmdb_id: m.id,
    title: m.title,
    overview: m.overview,
    poster_path: m.poster_path,
    release_date: m.release_date || null,
    content_type: 'movie',
    region: 'hollywood',
  }, { onConflict: 'tmdb_id' });

  if (error) console.error(`Failed to insert ${m.title}:`, error.message);
}

  const shows = await fetchPopularTV(1);
  for (const s of shows) {
    const { error } = await supabase.from('movies').upsert({
      tmdb_id: s.id,
      title: s.name,
      overview: s.overview,
      poster_path: s.poster_path,
      release_date: s.first_air_date || null,
      content_type: 'series',
      region: 'hollywood',
    }, { onConflict: 'tmdb_id' });

    if (error) console.error(`Failed to insert ${s.name}:`, error.message);
  }

  console.log(`Synced ${movies.length} movies and ${shows.length} shows.`);
}

syncTMDB().catch(console.error);
