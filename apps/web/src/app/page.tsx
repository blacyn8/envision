import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HeroSection } from '@/components/HeroSection'
import { MovieShelf } from '@/components/MovieShelf'
import { supabaseAdmin } from '@/lib/supabase.server'
import { getMoviesByRegion } from '@flixaura/db'

// Revalidate this page every hour — fresh enough for new releases,
// cheap enough not to hammer Supabase on every request.
export const revalidate = 3600

export default async function HomePage() {
  // Fetch all shelves in parallel — one round trip each, run together.
  const [hollywoodAll, anime, nollywoodAll] = await Promise.all([
    getMoviesByRegion(supabaseAdmin, 'hollywood', 28),
    getMoviesByRegion(supabaseAdmin, 'anime', 14),
    getMoviesByRegion(supabaseAdmin, 'nollywood', 28),
  ])

  const hollywoodMovies = hollywoodAll.filter((m) => m.content_type === 'movie').slice(0, 14)
  const hollywoodSeries = hollywoodAll.filter((m) => m.content_type === 'series').slice(0, 14)
  const nollywood = nollywoodAll.filter((m) => m.language !== 'yo').slice(0, 14)
  // "Yoruba" isn't its own region in our schema — it's Nollywood content
  // with Yoruba as the language. Filter accordingly.
  const yoruba = nollywoodAll.filter((m) => m.language === 'yo').slice(0, 14)

  // Hero — the 3rd-ranked Hollywood movie (matches the original design's
  // intent of not always leading with the #1 trending title), falling
  // back to the top one if fewer than 3 exist.
  const hero = hollywoodMovies[2] ?? hollywoodMovies[0]

  return (
    <>
      <Navbar />

      {hero && <HeroSection movie={hero} />}

      {/* ORDER MATTERS: Hollywood Movies → Hollywood Series → Anime → Nollywood → Yoruba */}
      <main className="mx-auto flex max-w-[1400px] flex-col gap-12 px-4 py-12 sm:px-8">
        <MovieShelf
          id="movies-hollywood"
          title="Hollywood Movies"
          subtitle="New & trending blockbusters"
          movies={hollywoodMovies}
          variant="primary"
        />
        <MovieShelf
          id="series-hollywood"
          title="Hollywood Series"
          subtitle="Binge-worthy seasons"
          movies={hollywoodSeries}
        />
        <MovieShelf id="anime" title="Anime" subtitle="Fresh subbed releases" movies={anime} variant="anime" />
        <MovieShelf
          id="nollywood"
          title="Nollywood"
          subtitle="Latest Nigerian cinema"
          movies={nollywood}
        />
        <MovieShelf id="yoruba" title="Yoruba Movies" subtitle="Stories from home" movies={yoruba} />
      </main>

      <Footer />
    </>
  )
}
