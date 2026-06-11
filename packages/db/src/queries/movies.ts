import { supabase } from '../client';

export async function getMovieById(id: string) {
  const { data: movie, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !movie) return null;

  const { data: embeds } = await supabase
    .from('youtube_embeds')
    .select('*')
    .eq('movie_id', id)
    .eq('is_full_content', true)
    .limit(1);

  return {
    ...movie,
    youtube_video_id: embeds?.[0]?.youtube_video_id ?? null,
  };
}

export async function listWatchableMovies() {
  const { data } = await supabase
    .from('movies')
    .select('id, title, poster_path, region, content_type, youtube_embeds!inner(youtube_video_id, is_full_content)')
    .eq('youtube_embeds.is_full_content', true);

  return data ?? [];
}
