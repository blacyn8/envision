/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from TMDB poster CDN, Cloudflare, and YouTube thumbnails
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
      { protocol: 'https', hostname: '*.cloudflare.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },

  // Redirect old-style routes if needed
  async redirects() {
    return [];
  },

  // Slim the bundle — don't ship playwright to the edge/client
  experimental: {
    serverComponentsExternalPackages: ['playwright', 'cheerio'],
  },
};

module.exports = nextConfig;
