import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MovieCard } from '@/components/MovieCard'
import { createSessionClient } from '@/lib/supabase.server'
import { getWatchlist } from '@flixaura/db'
import { Bookmark } from 'lucide-react'

// Always fresh — watchlist changes frequently
export const revalidate = 0

export default async function WatchlistPage() {
  const supabase = createSessionClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Extra server-side guard (middleware handles the redirect, this is belt-and-braces)
  if (!session) redirect('/login?next=/watchlist')

  const watchlistItems = await getWatchlist(supabase, session.user.id)
  const movies = watchlistItems.map((item) => item.movie).filter(Boolean)

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">My Watchlist</h1>
          <p className="mt-1 text-sm text-fa-text-dim">
            {movies.length} saved title{movies.length !== 1 ? 's' : ''}
          </p>
        </div>

        {movies.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <Bookmark size={40} className="text-fa-text-dim" />
            <p className="text-lg font-semibold">Nothing saved yet</p>
            <p className="text-sm text-fa-text-dim">
              Browse movies and hit the bookmark icon to save titles here.
            </p>
            <a
              href="/browse"
              className="mt-2 rounded-full bg-fa-accent px-5 py-2.5 text-sm font-bold text-fa-bg shadow-glow transition-all hover:shadow-glow-lg"
            >
              Browse movies
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
