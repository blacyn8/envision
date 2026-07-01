import { Film } from 'lucide-react'
import type { YoutubeEmbed } from '@flixaura/shared'

interface WatchSectionProps {
  movieTitle: string
  fullMovie: YoutubeEmbed | null
}

/**
 * WatchSection — embeds the full movie when a rightsholder-uploaded
 * YouTube version has been approved via the content pipeline
 * (packages/content-pipeline/src/youtube). Shows a "not available yet"
 * state otherwise — no third-party links are ever surfaced here.
 */
export function WatchSection({ movieTitle, fullMovie }: WatchSectionProps) {
  if (!fullMovie) {
    return (
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Watch</h2>
        <div className="rounded-xl border border-fa-line bg-fa-surface p-6 text-center">
          <Film size={28} className="mx-auto mb-3 text-fa-text-dim" />
          <p className="font-semibold">Not available to watch yet</p>
          <p className="mt-1 text-sm text-fa-text-dim">
            We only stream official uploads. Check back once one is approved.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-3 font-display text-lg font-bold">Watch Full Movie</h2>
      <div className="aspect-video overflow-hidden rounded-xl border border-fa-line">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${fullMovie.youtube_video_id}`}
          title={`${movieTitle} — full movie`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </section>
  )
}
