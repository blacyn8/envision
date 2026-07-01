'use client'

import type { Movie } from '@flixaura/shared'
import { MovieCard } from './MovieCard'
import { useDragScroll } from '@/hooks/useDragScroll'

interface MovieShelfProps {
  id: string
  title: string
  subtitle: string
  movies: Movie[]
  /** 'primary' highlights the shelf with a glow band — use for the first shelf only. */
  variant?: 'default' | 'primary' | 'anime'
}

/**
 * MovieShelf — one horizontal row of movie posters with a heading,
 * subtitle, and "See all" link. Supports drag-to-scroll on desktop
 * and native swipe on mobile.
 *
 * variant="primary" — subtle highlighted band, used for the first shelf
 * variant="anime"   — gradient title text, used for the Anime shelf
 */
export function MovieShelf({ id, title, subtitle, movies, variant = 'default' }: MovieShelfProps) {
  const scrollRef = useDragScroll<HTMLDivElement>()

  if (movies.length === 0) return null

  return (
    <section
      id={id}
      className={
        variant === 'primary'
          ? 'rounded-lg border border-fa-accent/10 bg-gradient-to-br from-fa-accent/[0.07] to-fa-accent-2/5 px-5 py-7 sm:px-7'
          : ''
      }
    >
      <div className="mb-4.5 flex items-end justify-between">
        <div>
          <h2
            className={`font-display text-2xl font-extrabold tracking-tight ${
              variant === 'anime' ? 'gradient-text' : ''
            }`}
          >
            {title}
          </h2>
          <p className="mt-1 text-[13px] text-fa-text-dim">{subtitle}</p>
        </div>
        <a href="#" className="flex-shrink-0 pb-1 text-[13px] font-semibold text-fa-accent hover:underline">
          See all →
        </a>
      </div>

      <div ref={scrollRef} className="shelf-track flex cursor-grab gap-4.5 overflow-x-auto pb-2">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  )
}
