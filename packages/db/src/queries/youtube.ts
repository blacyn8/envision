import { supabase } from '../client';

export async function addYoutubeEmbed(movieId: string, youtubeVideoId: string, isFullContent = false) {
  return supabase.from('youtube_embeds').insert({
    movie_id: movieId,
    youtube_video_id: youtubeVideoId,
    is_full_content: isFullContent,
  });
}

export async function getYoutubeEmbedsForMovie(movieId: string) {
  return supabase
    .from('youtube_embeds')
    .select('*')
    .eq('movie_id', movieId);
}
