import { Play } from 'lucide-react'
import type { Movie } from '@flixaura/shared'
import { formatRating, getRegionLabel } from '@flixaura/shared'
import { WatchlistButton } from '@/components/WatchlistButton'

interface HeroSectionProps {
  movie: Movie
}

/**
 * Hero banner — shows the top-rated recent Hollywood title as the
 * "Featured" spotlight. Background image is the movie's backdrop,
 * with a dark scrim gradient for text legibility.
 */
export function HeroSection({ movie }: HeroSectionProps) {
  const backdrop = movie.backdrop_url ?? movie.poster_url ?? '/placeholder-poster.svg'

  return (
    <section
      className="relative flex min-h-[420px] items-end bg-cover bg-[center_25%]"
      style={{ backgroundImage: `url('${backdrop}')` }}
    >
      {/* Scrim — fades the image into the page background for readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,15,26,0.15) 0%, rgba(11,15,26,0.55) 55%, #0b0f1a 100%), linear-gradient(90deg, rgba(11,15,26,0.85) 0%, rgba(11,15,26,0.25) 60%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-14 sm:px-8">
        <span className="mb-3.5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-fa-accent before:h-2 before:w-2 before:rounded-full before:bg-fa-accent before:shadow-glow">
          Featured · {getRegionLabel(movie.region)}
        </span>

        <h1 className="mb-4 max-w-[720px] font-display text-4xl font-extrabold leading-[1.02] tracking-tight [text-shadow:0_4px_40px_rgba(0,0,0,0.5)] sm:text-5xl md:text-6xl">
          {movie.title}
        </h1>

        <div className="mb-4.5 flex items-center gap-4 text-sm text-fa-text-dim">
          <span className="inline-flex items-center gap-1 rounded-full border border-fa-amber/30 bg-fa-amber/10 px-2.5 py-1 text-[13px] font-bold text-fa-amber">
            ★ {formatRating(movie.rating)}
          </span>
          <span>{movie.year}</span>
          {movie.genres.length > 0 && (
            <span className="hidden sm:inline">
              {movie.genres.slice(0, 3).map(capitalize).join(' · ')}
            </span>
          )}
        </div>

        {movie.synopsis && (
          <p className="mb-7 hidden max-w-[540px] text-[15px] leading-relaxed text-fa-text-dim sm:block">
            {movie.synopsis}
          </p>
        )}

        <div className="flex gap-3.5">
          <a
            href={`/movies/${movie.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-fa-accent px-6 py-3 text-sm font-bold text-fa-bg shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-glow-lg"
          >
            <Play size={18} fill="currentColor" />
            Play Now
          </a>
          <WatchlistButton movieId={movie.id} variant="pill" />
        </div>
      </div>
    </section>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
