/**
 * supabase.ts — Browser-side Supabase client
 *
 * Import this in React client components and hooks.
 * Uses the public anon key — only has access permitted by RLS policies.
 *
 * Usage:
 *   import { supabase } from '@/lib/supabase'
 *   const { data } = await supabase.from('movies').select('*')
 */

import { createBrowserClient } from '@supabase/ssr'

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton — reuse the same client across the app
export const supabase = createClient()
