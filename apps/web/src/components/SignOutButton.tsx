'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/**
 * SignOutButton — calls Supabase signOut then refreshes to clear server session.
 * Kept as a tiny client component so the profile page stays a server component.
 */
export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="inline-flex items-center gap-2 rounded-full border border-fa-line px-5 py-2.5 text-sm font-semibold text-fa-text-dim transition-colors hover:border-red-500/40 hover:text-red-400"
    >
      <LogOut size={16} />
      Sign out
    </button>
  )
}
