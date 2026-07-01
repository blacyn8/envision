import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SignOutButton } from '@/components/SignOutButton'
import { createSessionClient, supabaseAdmin } from '@/lib/supabase.server'
import { getProfile, getWatchHistory } from '@flixaura/db'
import { Crown, Film, Clock } from 'lucide-react'

export const revalidate = 0

export default async function ProfilePage() {
  const supabase = createSessionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login?next=/profile')

  const [profile, history] = await Promise.all([
    getProfile(supabaseAdmin, session.user.id),
    getWatchHistory(supabaseAdmin, session.user.id, 6),
  ])

  const tier = profile?.subscription_tier ?? 'free'
  const recentWatched = history.map((h) => h.movie).filter(Boolean)

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-8">

        {/* Header */}
        <div className="mb-8 flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-fa-accent to-fa-accent-2 font-display text-2xl font-extrabold text-fa-bg">
            {(profile?.display_name ?? session.user.email ?? 'U')[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold">
              {profile?.display_name ?? 'My account'}
            </h1>
            <p className="text-sm text-fa-text-dim">{session.user.email}</p>
          </div>
          <TierBadge tier={tier} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">

          {/* Subscription card */}
          <div className="rounded-2xl border border-fa-line bg-fa-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <Crown size={18} className="text-fa-amber" />
              <h2 className="font-display text-base font-bold">Subscription</h2>
            </div>
            <p className="mb-1 text-2xl font-extrabold capitalize">{tier}</p>
            <p className="mb-4 text-sm text-fa-text-dim">
              {tier === 'free'
                ? 'Free plan — ads shown, standard links only.'
                : `Active until ${profile?.subscription_expires_at
                    ? new Date(profile.subscription_expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A'}`}
            </p>
            {tier === 'free' && (
              <Link
                href="/api/stripe/checkout"
                className="inline-flex rounded-full bg-fa-accent px-5 py-2 text-sm font-bold text-fa-bg shadow-glow transition-all hover:shadow-glow-lg"
              >
                Upgrade to Premium
              </Link>
            )}
            {tier !== 'free' && (
              <Link
                href="/api/stripe/portal"
                className="inline-flex rounded-full border border-fa-line px-5 py-2 text-sm font-semibold text-fa-text-dim transition-colors hover:border-fa-accent hover:text-fa-accent"
              >
                Manage billing
              </Link>
            )}
          </div>

          {/* Stats card */}
          <div className="rounded-2xl border border-fa-line bg-fa-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <Film size={18} className="text-fa-accent" />
              <h2 className="font-display text-base font-bold">Activity</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatBlock
                label="Watched"
                value={String(history.length)}
                icon={<Clock size={14} />}
              />
            </div>
          </div>
        </div>

        {/* Recent watch history */}
        {recentWatched.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 font-display text-lg font-bold">Recently watched</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {recentWatched.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/movies/${movie.slug}`}
                  className="group"
                >
                  <div className="aspect-[2/3] overflow-hidden rounded-lg border border-fa-line bg-fa-surface transition-all group-hover:border-fa-accent/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.poster_url ?? '/placeholder-poster.svg'}
                      alt={movie.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-1.5 truncate text-xs font-semibold">{movie.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="mt-10 border-t border-fa-line pt-8">
          <SignOutButton />
        </div>
      </main>
      <Footer />
    </>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    free: 'border-fa-line text-fa-text-dim',
    premium: 'border-fa-accent/30 bg-fa-accent/10 text-fa-accent',
    pro: 'border-fa-amber/30 bg-fa-amber/10 text-fa-amber',
  }
  return (
    <span className={`ml-auto rounded-full border px-3 py-1 text-xs font-bold capitalize ${map[tier] ?? map.free}`}>
      {tier}
    </span>
  )
}

function StatBlock({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-fa-line bg-fa-bg p-3 text-center">
      <div className="mb-1 flex items-center justify-center gap-1 text-fa-text-dim">{icon}</div>
      <p className="font-display text-xl font-extrabold">{value}</p>
      <p className="text-xs text-fa-text-dim">{label}</p>
    </div>
  )
}
