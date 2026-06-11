import { getMovieById } from '@flixaura/db';
import { YoutubePlayer } from '@/components/YoutubePlayer';
import { notFound } from 'next/navigation';

export default async function WatchPage({ params }: { params: { id: string } }) {
  const movie = await getMovieById(params.id);

  if (!movie) return notFound();

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-bold">{movie.title}</h1>
      {movie.youtube_video_id ? (
        <YoutubePlayer videoId={movie.youtube_video_id} />
      ) : (
        <p>No video available for this title yet.</p>
      )}
      <p className="mt-4 text-gray-600">{movie.overview}</p>
    </div>
  );
}
