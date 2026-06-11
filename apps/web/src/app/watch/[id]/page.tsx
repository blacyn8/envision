import { getMovieById } from '@flixaura/db';
import { YoutubePlayer } from '@/components/YoutubePlayer';
import { notFound } from 'next/navigation';

export default async function WatchPage({ params }: { params: { id: string } }) {
  const movie = await getMovieById(params.id);

  if (!movie || !movie.youtube_video_id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <YoutubePlayer videoId={movie.youtube_video_id} />
      <h1 className="mt-4 text-2xl font-bold">{movie.title}</h1>
      <p className="mt-2 text-sm text-gray-400">{movie.region} · {movie.content_type}</p>
      {movie.overview && (
        <p className="mt-4 text-base leading-relaxed">{movie.overview}</p>
      )}
    </div>
  );
}
