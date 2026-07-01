import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { WatchSection } from '@/components/WatchSection'
import { WatchlistButton } from '@/components/WatchlistButton'
import { supabaseAdmin } from '@/lib/supabase.server'
import { getMovieBySlug, getYoutubeEmbedsForMovie } from '@flixaura/db'
import { formatRating, formatRuntime, getRegionLabel, getRegionFlag } from '@flixaura/shared'

// Pre-render at build time then update in background — good for SEO
export const revalidate = 3600

interface MoviePageProps {
  params: { slug: string }
}

// Generate SEO metadata for each movie page
export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const movie = await getMovieBySlug(supabaseAdmin, params.slug)
  if (!movie) return { title: 'Movie not found — FlixAura' }

  return {
    title: `${movie.title} (${movie.year}) — FlixAura`,
    description: movie.synopsis ?? `Watch ${movie.title} on FlixAura.`,
    openGraph: {
      title: movie.title,
      description: movie.synopsis ?? '',
      images: movie.poster_url ? [{ url: movie.poster_url }] : [],
    },
  }
}

export default async function MoviePage({ params }: MoviePageProps) {
  // Fetch movie + links + embeds in parallel
  const movie = await getMovieBySlug(supabaseAdmin, params.slug)
  if (!movie) notFound()

  const embeds = await getYoutubeEmbedsForMovie(supabaseAdmin, movie.id)

  const trailer = embeds.find((e) => e.is_official_trailer) ?? null
  const fullMovie = embeds.find((e) => e.is_full_content) ?? null
  const recap = embeds.find((e) => e.is_recap) ?? null

  return (
    <>
      <Navbar />

      {/* Backdrop hero */}
      <div
        className="relative flex min-h-[320px] items-end bg-cover bg-center"
        style={{
          backgroundImage: movie.backdrop_url
            ? `url('${movie.backdrop_url}')`
            : undefined,
          backgroundColor: movie.backdrop_url ? undefined : '#161d33',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,15,26,0.2) 0%, rgba(11,15,26,0.7) 60%, #0b0f1a 100%)',
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-8 sm:px-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-fa-accent">
            {getRegionFlag(movie.region)} {getRegionLabel(movie.region)}
          </span>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            {movie.title}
          </h1>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">

          {/* LEFT — poster + quick stats */}
          <aside className="flex flex-col gap-5">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-fa-line bg-fa-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={movie.poster_url ?? '/placeholder-poster.svg'}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Quick stats */}
            <div className="rounded-xl border border-fa-line bg-fa-surface p-4 text-sm">
              {movie.rating != null && (
                <StatRow label="Rating" value={`★ ${formatRating(movie.rating)} / 10`} highlight />
              )}
              <StatRow label="Year" value={String(movie.year)} />
              {movie.runtime_minutes && (
                <StatRow label="Runtime" value={formatRuntime(movie.runtime_minutes)} />
              )}
              {movie.language && (
                <StatRow label="Language" value={movie.language.toUpperCase()} />
              )}
              {movie.is_series && movie.season_count && (
                <StatRow label="Seasons" value={String(movie.season_count)} />
              )}
              {movie.genres.length > 0 && (
                <StatRow
                  label="Genre"
                  value={movie.genres.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}
                />
              )}
            </div>

            {/* Subtitle availability */}
            {(movie.has_subtitle_en || movie.has_subtitle_sw || movie.has_subtitle_yo) && (
              <div className="rounded-xl border border-fa-line bg-fa-surface p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-fa-text-dim">
                  Subtitles
                </p>
                <div className="flex flex-wrap gap-2">
                  {movie.has_subtitle_en && <SubBadge label="English" />}
                  {movie.has_subtitle_sw && <SubBadge label="Swahili" />}
                  {movie.has_subtitle_yo && <SubBadge label="Yoruba" />}
                </div>
              </div>
            )}

            {/* Watchlist button */}
            <WatchlistButton movieId={movie.id} />
          </aside>

          {/* RIGHT — synopsis, trailer, download links */}
          <div className="flex flex-col gap-8">

            {/* Synopsis */}
            {movie.synopsis && (
              <section>
                <h2 className="mb-3 font-display text-lg font-bold">Synopsis</h2>
                <p className="leading-relaxed text-fa-text-dim">{movie.synopsis}</p>
              </section>
            )}

            {/* AI mood tags */}
            {movie.ai_tags && movie.ai_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.ai_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-fa-accent/20 bg-fa-accent/5 px-3 py-1 text-xs font-medium text-fa-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* YouTube trailer */}
            {trailer && (
              <section>
                <h2 className="mb-3 font-display text-lg font-bold">Trailer</h2>
                <div className="aspect-video overflow-hidden rounded-xl border border-fa-line">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${trailer.youtube_video_id}`}
                    title={`${movie.title} trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              </section>
            )}

            {/* Full movie — only rendered once an official upload is approved.
                Falls back to a clearly labeled recap when that's all we have. */}
            <WatchSection movieTitle={movie.title} fullMovie={fullMovie} recap={recap} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-fa-line py-2 last:border-0">
      <span className="text-fa-text-dim">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-fa-amber' : 'text-fa-text'}`}>
        {value}
      </span>
    </div>
  )
}

function SubBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-fa-line bg-fa-bg px-3 py-1 text-xs font-medium text-fa-text-dim">
      {label}
    </span>
  )
}
