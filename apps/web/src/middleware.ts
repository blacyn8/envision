import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * middleware.ts — Route protection
 *
 * Runs on every request BEFORE the page renders.
 * Protected routes (/watchlist, /profile) check for a valid
 * Supabase session. Unauthenticated users are redirected to /login
 * with a `next` param so they return to the right page after signing in.
 *
 * Public routes (/, /browse, /movies/*, /watch, /login, /signup)
 * pass through without any check.
 */

const PROTECTED_ROUTES = ['/watchlist', '/profile']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only run auth check on protected routes
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  if (!isProtected) return NextResponse.next()

  // Build a response we can attach updated cookies to
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Create a session-aware Supabase client using the request cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          response.cookies.set({ name, value, ...options })
        },
        remove: (name: string, options: CookieOptions) => {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // No session — redirect to /login with return URL
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  // Run middleware on all routes except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
