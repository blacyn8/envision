import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ─── Environment validation ───────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

// ─── Browser client (safe — uses anon key) ───────────────────────────────────
// Use this in React components and client-side code.
// The anon key only has permissions defined by your Supabase RLS policies.

let browserClient: SupabaseClient | null = null

export function getBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient
  browserClient = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
  return browserClient
}

// ─── Server client (privileged — uses service role key) ──────────────────────
// Use this ONLY in API routes, server components, and cron jobs.
// NEVER import this in any client-facing file.

export function getServerClient(): SupabaseClient {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        // Server client doesn't need to persist sessions
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
