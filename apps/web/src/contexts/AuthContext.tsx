'use client'

/**
 * AuthContext.tsx — Supabase auth session provider
 *
 * Wraps the app in a React context that exposes the current user session.
 * Any component can call useAuth() instead of calling supabase.auth directly.
 *
 * Add <AuthProvider> inside layout.tsx, outside any page content.
 *
 * Usage:
 *   const { user, session, loading } = useAuth()
 */

import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth — consume the auth context in any client component.
 *
 * Example:
 *   const { user } = useAuth()
 *   if (!user) redirect('/login')
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
