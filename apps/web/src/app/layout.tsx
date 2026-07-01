import type { Metadata } from 'next'
import { Bricolage_Grotesque, Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import './../styles/globals.css'

// Display face — headings, logo, hero titles
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '800'],
})

// Body face — everything else
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'FlixAura — Watch Movies & Series',
  description:
    'Your aura, your screen. Hollywood, Nollywood, Yoruba, KDrama, Bollywood and Anime — all in one place.',
  keywords: ['movies', 'series', 'anime', 'nollywood', 'kdrama', 'bollywood', 'download'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        {/*
          AuthProvider — wraps the entire app so any client component
          can call useAuth() to get the current user session.
          Does NOT affect server components or API routes.
        */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
