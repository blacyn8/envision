import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { WatchSearchBox } from '@/components/WatchSearchBox'
import { SearchResultCard, type SearchResult } from '@/components/SearchResultCard'
import { supabaseAdmin } from '@/lib/supabase.server'
import { searchMovies, getExternalLinksForMovie, getYoutubeEmbedsForMovie } from '@flixaura/db'

interface WatchPageProps {
  searchParams: { q?: string }
}

// Always fetch fresh — search results should reflect the latest scraper runs.
export const dynamic = 'force-dynamic'

export default async function WatchPage({ searchParams }: WatchPageProps) {
  const query = searchParams.q?.trim() ?? ''
  const results = query ? await getSearchResults(query) : []

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-[900px] px-4 py-12 sm:px-8">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Search &amp; <span className="gradient-text">Get</span>
          </h1>
          <p className="mt-2 text-sm text-fa-text-dim">
            Find a movie, series, or anime title — watch the trailer, then stream or download.
          </p>
        </div>

        <WatchSearchBox initialQuery={query} />

        <div className="mt-8 flex flex-col gap-4">
          {query && results.length === 0 && (
            <p className="py-12 text-center text-sm text-fa-text-dim">
              No titles found for &ldquo;{query}&rdquo;. Try a different spelling or a shorter
              search.
            </p>
          )}

          {results.map((result) => (
            <SearchResultCard key={result.movie.id} result={result} />
          ))}

          {!query && (
            <p className="py-12 text-center text-sm text-fa-text-dim">
              Start typing a title above to find movies, series, and anime.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}

// ─── Data fetching ──────────────────────────────────────────────────────────

async function getSearchResults(query: string): Promise<SearchResult[]> {
  const movies = await searchMovies(supabaseAdmin, query, 12)

  return Promise.all(
    movies.map(async (movie) => {
      const [allLinks, embeds] = await Promise.all([
        getExternalLinksForMovie(supabaseAdmin, movie.id),
        getYoutubeEmbedsForMovie(supabaseAdmin, movie.id),
      ])

      return {
        movie,
        links: {
          stream: allLinks.filter((l) => l.link_type === 'stream'),
          download: allLinks.filter((l) => l.link_type === 'download'),
        },
        trailer: embeds.find((e) => e.is_official_trailer) ?? null,
      }
    })
  )
}
