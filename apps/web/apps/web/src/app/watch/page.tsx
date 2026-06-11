import { listWatchableMovies } from '@flixaura/db';
import Link from 'next/link';

export default async function WatchListPage() {
  const movies = await listWatchableMovies();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Watch Now</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {movies.map((m: any) => (
          <Link key={m.id} href={`/watch/${m.id}`} className="block">
            <div className="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden">
              {m.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                  alt={m.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <p className="mt-2 text-sm font-medium">{m.title}</p>
          </Link>
        ))}
      </div>
      {movies.length === 0 && (
        <p className="text-gray-400">No watchable content yet — run the YouTube seed script.</p>
      )}
    </div>
  );
}
