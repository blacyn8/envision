/**
 * loading.tsx — Global loading UI.
 *
 * Next.js shows this automatically while any page in the app
 * is loading (server-side streaming). Keeps the user informed
 * without a blank white screen.
 *
 * Uses CSS-only animation — no JS dependency, zero bundle cost.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-fa-bg">

      {/* Navbar skeleton */}
      <div className="border-b border-fa-line bg-fa-bg/75 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="h-9 w-32 animate-pulse rounded-lg bg-fa-surface" />
          <div className="hidden gap-6 md:flex">
            {[80, 64, 56, 88, 56].map((w, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-fa-surface" style={{ width: w }} />
            ))}
          </div>
          <div className="h-9 w-9 animate-pulse rounded-full bg-fa-surface" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="h-[300px] w-full animate-pulse bg-fa-surface sm:h-[380px]" />

      {/* Shelf skeletons */}
      <div className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="mb-12">
            {/* Shelf heading */}
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="mb-2 h-6 w-40 animate-pulse rounded bg-fa-surface" />
                <div className="h-3.5 w-28 animate-pulse rounded bg-fa-surface" />
              </div>
              <div className="h-4 w-14 animate-pulse rounded bg-fa-surface" />
            </div>

            {/* Card row */}
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-shrink-0" style={{ width: 140 }}>
                  <div className="aspect-[2/3] animate-pulse rounded-xl bg-fa-surface" />
                  <div className="mt-2 h-3.5 w-4/5 animate-pulse rounded bg-fa-surface" />
                  <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-fa-surface" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
