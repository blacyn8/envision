import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        flixaura: {
          dark: '#0B0F1A',
          accent: '#7C3AED',
          gold: '#F4B400',
        },
      },
    },
  },
  plugins: [],
};
export default config;
