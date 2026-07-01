import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'
import type { Movie } from '@flixaura/shared'
import { formatRating } from '@flixaura/shared'

interface MovieCardProps {
  movie: Movie
}

/**
 * MovieCard — a single poster tile inside a shelf row.
 * On hover: poster lifts, glows cyan, and shows a play icon overlay.
 */
export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link
      href={`/movies/${movie.slug}`}
      className="title-card flex w-[140px] flex-shrink-0 flex-col gap-2 sm:w-[180px]"
    >
      <div className="group relative aspect-[2/3] overflow-hidden rounded-xl border border-fa-line bg-fa-surface transition-all duration-300 hover:-translate-y-1 hover:border-fa-accent/40 hover:shadow-[0_12px_32px_rgba(79,209,255,0.18)]">
        {movie.poster_url && (
          <Image
            src={movie.poster_url}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 140px, 180px"
            className="object-cover transition-transform duration-400 group-hover:scale-105"
          />
        )}

        {/* Rating badge */}
        {movie.rating != null && (
          <span className="absolute left-2.5 top-2.5 rounded-full border border-fa-amber/25 bg-fa-bg/70 px-2 py-0.5 text-xs font-bold text-fa-amber backdrop-blur-sm">
            ★ {formatRating(movie.rating)}
          </span>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-fa-bg/35 text-fa-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Play size={28} fill="currentColor" className="drop-shadow-[0_0_12px_rgba(79,209,255,0.8)]" />
        </div>
      </div>

      <p className="truncate text-sm font-semibold leading-tight">{movie.title}</p>
      <p className="text-xs text-fa-text-dim">{movie.year}</p>
    </Link>
  )
}
