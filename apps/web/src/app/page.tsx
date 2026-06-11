import { supabase } from '@flixaura/db';
import Image from 'next/image';

export const revalidate = 3600;

export default async function HomePage() {
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-flixaura-gold">Flix-Aura</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {movies?.map((movie) => (
          <div key={movie.id} className="rounded overflow-hidden bg-gray-900">
            {movie.poster_path && (
              <Image
                src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                alt={movie.title}
                width={300}
                height={450}
                className="w-full h-auto"
              />
            )}
            <p className="p-2 text-sm truncate">{movie.title}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
