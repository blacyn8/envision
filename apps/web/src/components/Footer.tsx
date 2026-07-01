const BROWSE_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/browse', label: 'Browse all' },
  { href: '/watch', label: 'Search & Get' },
  { href: '/watchlist', label: 'My Watchlist' },
]

const INFO_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/dmca', label: 'DMCA' },
]

export function Footer() {
  return (
    <footer className="border-t border-fa-line bg-fa-bg-soft px-4 py-12 sm:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-10">
        <div className="flex max-w-[320px] flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-gradient-to-br from-fa-accent to-fa-accent-2 font-display text-[13px] font-extrabold text-fa-bg">
              FA
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">
              Flix<em className="font-extrabold not-italic text-fa-accent">Aura</em>
            </span>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-fa-text-dim">
            Your aura, your screen. Movies, series &amp; anime — anytime.
          </p>
        </div>

        <div className="flex gap-16">
          <div>
            <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-fa-text-dim">
              Browse
            </h4>
            {BROWSE_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="mb-2 block text-sm text-fa-text transition-colors hover:text-fa-accent"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div>
            <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-fa-text-dim">
              Info
            </h4>
            {INFO_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="mb-2 block text-sm text-fa-text transition-colors hover:text-fa-accent"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-[1400px] text-center text-xs text-fa-text-dim">
        © {new Date().getFullYear()} FlixAura. All titles belong to their respective owners.
      </p>
    </footer>
  )
}
