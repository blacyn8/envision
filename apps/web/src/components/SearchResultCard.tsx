import Link from 'next/link'
import Image from 'next/image'
import { Play, Film, Subtitles, Clock } from 'lucide-react'
import type { Movie, YoutubeEmbed } from '@flixaura/shared'
import { formatRating, formatRuntime, getRegionLabel } from '@flixaura/shared'

export interface SearchResult {
  movie: Movie
  trailer: YoutubeEmbed | null
  fullMovie: YoutubeEmbed | null
}

interface SearchResultCardProps {
  result: SearchResult
}

/**
 * SearchResultCard — the core "Search & Get" result.
 *
 * Always shows a YouTube trailer link if one exists. Links through to the
 * movie page to watch the full movie when an official upload has been
 * approved via the content pipeline; otherwise shows an honest
 * "not available yet" state rather than any third-party link.
 */
export function SearchResultCard({ result }: SearchResultCardProps) {
  const { movie, trailer, fullMovie } = result

  return (
    <article className="flex flex-col gap-5 rounded-lg border border-fa-line bg-fa-surface p-4 sm:flex-row sm:p-5">
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full flex-shrink-0 overflow-hidden rounded-xl bg-fa-bg-soft sm:w-[140px]">
        {movie.poster_url && (
          <Image
            src={movie.poster_url}
            alt={movie.title}
            fill
            sizes="140px"
            className="object-cover"
          />
        )}
      </div>

      {/* Info + actions */}
      <div className="flex flex-1 flex-col gap-3">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-fa-line bg-fa-bg-soft px-2.5 py-0.5 text-xs font-semibold text-fa-text-dim">
              {getRegionLabel(movie.region)}
            </span>
            {movie.rating != null && (
              <span className="inline-flex items-center gap-1 rounded-full border border-fa-amber/25 bg-fa-amber/10 px-2.5 py-0.5 text-xs font-bold text-fa-amber">
                ★ {formatRating(movie.rating)}
              </span>
            )}
          </div>

          <h3 className="font-display text-lg font-bold leading-tight sm:text-xl">{movie.title}</h3>

          <div className="mt-1 flex items-center gap-3 text-xs text-fa-text-dim">
            <span>{movie.year}</span>
            {movie.runtime_minutes && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} /> {formatRuntime(movie.runtime_minutes)}
              </span>
            )}
          </div>

          {movie.synopsis && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-fa-text-dim">
              {movie.synopsis}
            </p>
          )}
        </div>

        {/* Subtitle availability */}
        {(movie.has_subtitle_en || movie.has_subtitle_sw || movie.has_subtitle_yo) && (
          <div className="flex items-center gap-1.5 text-xs text-fa-text-dim">
            <Subtitles size={14} className="text-fa-accent" />
            <span>
              Subtitles:{' '}
              {[
                movie.has_subtitle_en && 'English',
                movie.has_subtitle_sw && 'Swahili',
                movie.has_subtitle_yo && 'Yoruba',
              ]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        )}

        {/* Trailer — always shown if available */}
        {trailer && (
          <a
            href={`https://www.youtube.com/watch?v=${trailer.youtube_video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-fa-line bg-fa-bg-soft px-4 py-2 text-sm font-semibold transition-colors hover:border-fa-accent hover:text-fa-accent"
          >
            <Play size={16} fill="currentColor" />
            Watch trailer
          </a>
        )}

        {fullMovie ? (
          <Link
            href={`/movies/${movie.slug}`}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-fa-accent px-4 py-2 text-sm font-bold text-fa-bg shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-glow-lg"
          >
            <Film size={16} />
            Watch full movie
          </Link>
        ) : (
          <div className="rounded-lg border border-dashed border-fa-line bg-fa-bg-soft px-4 py-3 text-sm text-fa-text-dim">
            {trailer
              ? 'Full movie not available yet — trailer available above.'
              : 'Not available yet. Check back shortly.'}
          </div>
        )}
      </div>
    </article>
  )
}
