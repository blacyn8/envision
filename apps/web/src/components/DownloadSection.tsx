'use client'

import { useState } from 'react'
import { Download, Play, ExternalLink } from 'lucide-react'
import type { ExternalLink as ExternalLinkType } from '@flixaura/shared'

interface DownloadSectionProps {
  movieId: string
  streamLinks: ExternalLinkType[]
  downloadLinks: ExternalLinkType[]
}

/**
 * DownloadSection — the Nkiri-style core of the movie detail page.
 *
 * Groups links by quality (4K, HD, 720p, 480p, 3GP).
 * Each group shows its available sources as clickable buttons.
 * Clicking fires a background click-tracking request then opens the link.
 *
 * When no links exist yet (scraper hasn't run), shows a "coming soon" state.
 */
export function DownloadSection({ movieId, streamLinks, downloadLinks }: DownloadSectionProps) {
  const [activeTab, setActiveTab] = useState<'download' | 'stream'>(
    downloadLinks.length > 0 ? 'download' : 'stream'
  )

  const hasLinks = streamLinks.length > 0 || downloadLinks.length > 0

  async function handleLinkClick(linkId: string) {
    // Non-blocking — tracks click in background, doesn't delay navigation
    fetch('/api/links/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId }),
    }).catch(() => {})
  }

  if (!hasLinks) {
    return (
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Download / Stream</h2>
        <div className="rounded-xl border border-fa-line bg-fa-surface p-6 text-center">
          <Download size={28} className="mx-auto mb-3 text-fa-text-dim" />
          <p className="font-semibold">Links coming soon</p>
          <p className="mt-1 text-sm text-fa-text-dim">
            Our content pipeline is still indexing links for this title.
            Check back shortly.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-4 font-display text-lg font-bold">Download / Stream</h2>

      {/* Tab toggle — Download vs Stream */}
      {streamLinks.length > 0 && downloadLinks.length > 0 && (
        <div className="mb-5 flex gap-2">
          <TabBtn
            active={activeTab === 'download'}
            onClick={() => setActiveTab('download')}
            icon={<Download size={15} />}
            label="Download"
          />
          <TabBtn
            active={activeTab === 'stream'}
            onClick={() => setActiveTab('stream')}
            icon={<Play size={15} fill="currentColor" />}
            label="Stream"
          />
        </div>
      )}

      {/* Link groups — grouped by quality */}
      <div className="flex flex-col gap-3">
        {groupByQuality(
          activeTab === 'download' ? downloadLinks : streamLinks
        ).map(([quality, links]) => (
          <div key={quality} className="rounded-xl border border-fa-line bg-fa-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <QualityBadge quality={quality} />
              <span className="text-xs text-fa-text-dim">
                {links.length} source{links.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  onClick={() => handleLinkClick(link.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-fa-line bg-fa-bg px-4 py-2 text-sm font-semibold transition-all hover:border-fa-accent hover:text-fa-accent"
                >
                  {activeTab === 'download' ? <Download size={13} /> : <Play size={13} />}
                  {link.provider_name}
                  <ExternalLink size={11} className="opacity-50" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const QUALITY_ORDER = ['4K', 'HD', '720p', '480p', '360p', '3GP']

function groupByQuality(links: ExternalLinkType[]): [string, ExternalLinkType[]][] {
  const map = new Map<string, ExternalLinkType[]>()

  for (const link of links) {
    const q = link.quality ?? 'Unknown'
    if (!map.has(q)) map.set(q, [])
    map.get(q)!.push(link)
  }

  // Return sorted by quality order, unknown at the end
  return [...map.entries()].sort(([a], [b]) => {
    const ai = QUALITY_ORDER.indexOf(a)
    const bi = QUALITY_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

function QualityBadge({ quality }: { quality: string }) {
  const colourMap: Record<string, string> = {
    '4K': 'border-fa-accent/30 bg-fa-accent/10 text-fa-accent',
    'HD': 'border-green-500/30 bg-green-500/10 text-green-400',
    '720p': 'border-fa-amber/30 bg-fa-amber/10 text-fa-amber',
    '480p': 'border-fa-line bg-fa-bg text-fa-text-dim',
    '360p': 'border-fa-line bg-fa-bg text-fa-text-dim',
    '3GP': 'border-fa-line bg-fa-bg text-fa-text-dim',
  }
  const cls = colourMap[quality] ?? 'border-fa-line bg-fa-bg text-fa-text-dim'

  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {quality}
    </span>
  )
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'border-fa-accent bg-fa-accent/10 text-fa-accent'
          : 'border-fa-line text-fa-text-dim hover:border-fa-accent/40 hover:text-fa-text'
      }`}
    >
      {icon} {label}
    </button>
  )
}
