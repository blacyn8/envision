export interface Movie {
  id: string;
  tmdb_id?: number;
  title: string;
  overview?: string;
  poster_path?: string;
  release_date?: string;
  content_type: 'movie' | 'series';
  region: string;
  source_url?: string;
  created_at?: string;
}

export interface YoutubeEmbed {
  id: string;
  movie_id: string;
  youtube_video_id: string;
  is_full_content: boolean;
}

export interface ExternalLink {
  id: string;
  movie_id: string;
  source: string;
  quality?: string;
  url: string;
  has_subtitles: boolean;
  click_count: number;
}
