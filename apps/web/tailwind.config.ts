import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // FlixAura brand palette — deep night blue base, electric cyan accent
        fa: {
          // Backgrounds
          bg: '#0b0f1a',
          'bg-soft': '#11172a',
          surface: '#161d33',
          line: 'rgba(255,255,255,0.06)',
          // Text
          text: '#eef1f8',
          'text-dim': '#9aa3bd',
          // Accents
          accent: '#4fd1ff',     // electric cyan glow — primary CTAs, active states
          'accent-2': '#7c5cff', // violet support — gradients, anime shelf
          amber: '#ffc857',      // ratings, highlights
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'], // Bricolage Grotesque
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'], // Inter
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '20px',
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      boxShadow: {
        glow: '0 0 24px rgba(79, 209, 255, 0.45)',
        'glow-lg': '0 0 36px rgba(79, 209, 255, 0.65)',
      },
    },
  },
  plugins: [],
}

export default config
