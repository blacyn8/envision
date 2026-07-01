/**
 * watch/loading.tsx — Loading skeleton for the /watch search results page.
 * Shows while Supabase and the search query are resolving.
 */
export default function WatchLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-fa-bg">

      {/* Navbar skeleton */}
      <div className="border-b border-fa-line bg-fa-bg/75 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between">
          <div className="h-9 w-32 animate-pulse rounded-lg bg-fa-surface" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-fa-surface" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-[860px] px-4 py-10 sm:px-8">
        {/* Search box skeleton */}
        <div className="mb-10">
          <div className="mx-auto mb-3 h-6 w-40 animate-pulse rounded bg-fa-surface" />
          <div className="h-12 w-full animate-pulse rounded-full bg-fa-surface" />
        </div>

        {/* Result card skeletons */}
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-fa-line bg-fa-surface p-4 sm:gap-5 sm:p-5"
            >
              {/* Poster */}
              <div className="mx-auto h-[160px] w-[107px] flex-shrink-0 animate-pulse rounded-lg bg-fa-bg sm:mx-0" />
              {/* Text */}
              <div className="flex flex-1 flex-col gap-3 pt-1">
                <div className="h-4 w-1/4 animate-pulse rounded bg-fa-bg" />
                <div className="h-6 w-3/4 animate-pulse rounded bg-fa-bg" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-fa-bg" />
                <div className="h-3.5 w-full animate-pulse rounded bg-fa-bg" />
                <div className="h-3.5 w-2/3 animate-pulse rounded bg-fa-bg" />
                <div className="mt-2 flex gap-2">
                  <div className="h-9 w-32 animate-pulse rounded-full bg-fa-bg" />
                  <div className="h-9 w-36 animate-pulse rounded-full bg-fa-bg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
