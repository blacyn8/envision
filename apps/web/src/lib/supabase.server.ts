/**
 * supabase.server.ts — Server-side Supabase client
 *
 * Import this ONLY in:
 *   - API route handlers (app/api/.../route.ts)
 *   - Server Components (no 'use client' directive)
 *   - Cron jobs and scripts
 *
 * Uses the service role key — bypasses RLS, has full DB access.
 * NEVER import this in any client component or expose to the browser.
 *
 * Usage:
 *   import { supabaseServer } from '@/lib/supabase.server'
 *   const { data } = await supabaseServer.from('movies').select('*')
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Session-aware server client.
 * Use this in Server Components and Route Handlers where you need
 * to read the current user's session from cookies.
 */
export function createSessionClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // set() can throw in Server Components — safe to ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // same as above
          }
        },
      },
    }
  )
}

/**
 * Privileged admin client.
 * Use this for operations that need to bypass RLS:
 * scraping, cron jobs, admin writes, webhook handlers.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
