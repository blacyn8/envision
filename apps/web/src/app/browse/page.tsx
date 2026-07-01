import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MovieCard } from '@/components/MovieCard'
import { supabaseAdmin } from '@/lib/supabase.server'
import { getMovies } from '@flixaura/db'
import type { BrowsePageParams } from '@/types'
import type { Region, Genre } from '@flixaura/shared'
import { getRegionLabel, getRegionFlag } from '@flixaura/shared'

// Revalidate every 30 minutes — browse grid changes with new content
export const revalidate = 1800

interface BrowsePageProps {
  searchParams: BrowsePageParams
}

const REGIONS = [
  'hollywood', 'nollywood', 'kdrama', 'bollywood', 'anime', 'african',
] as Region[]

const GENRES = [
  'action', 'romance', 'thriller', 'comedy', 'horror',
  'sci-fi', 'drama', 'animation', 'documentary', 'fantasy',
] as Genre[]

const YEARS = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - i))

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const region = searchParams.region as Region | undefined
  const genre = searchParams.genre as Genre | undefined
  const year = searchParams.year ? Number(searchParams.year) : undefined
  const page = searchParams.page ? Number(searchParams.page) : 1

  const { data: movies, total, has_more } = await getMovies(supabaseAdmin, {
    region,
    genre,
    year,
    page,
    per_page: 24,
  })

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Browse
          </h1>
          <p className="mt-1 text-sm text-fa-text-dim">
            {total.toLocaleString()} titles across all regions
          </p>
        </div>

        {/* Filter bar */}
        <form method="GET" className="mb-8 flex flex-wrap gap-3">
          {/* Region filter */}
          <select
            name="region"
            defaultValue={region ?? ''}
            className="rounded-full border border-fa-line bg-fa-surface px-4 py-2 text-sm text-fa-text outline-none focus:border-fa-accent"
          >
            <option value="">All regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {getRegionFlag(r)} {getRegionLabel(r)}
              </option>
            ))}
          </select>

          {/* Genre filter */}
          <select
            name="genre"
            defaultValue={genre ?? ''}
            className="rounded-full border border-fa-line bg-fa-surface px-4 py-2 text-sm text-fa-text outline-none focus:border-fa-accent"
          >
            <option value="">All genres</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>

          {/* Year filter */}
          <select
            name="year"
            defaultValue={searchParams.year ?? ''}
            className="rounded-full border border-fa-line bg-fa-surface px-4 py-2 text-sm text-fa-text outline-none focus:border-fa-accent"
          >
            <option value="">All years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Apply */}
          <button
            type="submit"
            className="rounded-full bg-fa-accent px-5 py-2 text-sm font-bold text-fa-bg shadow-glow transition-all hover:shadow-glow-lg"
          >
            Apply
          </button>

          {/* Clear — only shown when filters are active */}
          {(region || genre || year) && (
            <a
              href="/browse"
              className="rounded-full border border-fa-line px-5 py-2 text-sm font-semibold text-fa-text-dim transition-colors hover:border-fa-accent hover:text-fa-accent"
            >
              Clear
            </a>
          )}
        </form>

        {/* Movie grid */}
        {movies.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="text-lg font-semibold">No results found</p>
            <p className="text-sm text-fa-text-dim">
              Try a different region, genre, or year.
            </p>
            <a
              href="/browse"
              className="mt-2 rounded-full bg-fa-accent px-5 py-2 text-sm font-bold text-fa-bg shadow-glow"
            >
              Clear filters
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {(page > 1 || has_more) && (
          <div className="mt-10 flex items-center justify-center gap-4">
            {page > 1 && (
              <a
                href={buildPageUrl(searchParams, page - 1)}
                className="rounded-full border border-fa-line px-6 py-2.5 text-sm font-semibold transition-colors hover:border-fa-accent hover:text-fa-accent"
              >
                ← Previous
              </a>
            )}
            <span className="text-sm text-fa-text-dim">Page {page}</span>
            {has_more && (
              <a
                href={buildPageUrl(searchParams, page + 1)}
                className="rounded-full bg-fa-accent px-6 py-2.5 text-sm font-bold text-fa-bg shadow-glow transition-all hover:shadow-glow-lg"
              >
                Next →
              </a>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}

/** Builds a URL for a page change while preserving current filters */
function buildPageUrl(params: BrowsePageParams, page: number): string {
  const qs = new URLSearchParams()
  if (params.region) qs.set('region', params.region)
  if (params.genre) qs.set('genre', params.genre)
  if (params.year) qs.set('year', params.year)
  qs.set('page', String(page))
  return `/browse?${qs.toString()}`
}
