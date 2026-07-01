import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from TMDB poster CDN and Cloudflare
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
      },
    ],
  },

  // Redirect old-style routes if needed
  async redirects() {
    return []
  },

  // Slim the bundle — don't ship playwright to the edge/client
  serverExternalPackages: ['playwright', 'cheerio'],
}

export default nextConfig
