import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          950: '#09090b',
          900: '#18181b',
          800: '#27272a',
          700: '#3f3f46',
          500: '#71717a',
          400: '#a1a1aa',
          200: '#e4e4e7',
          100: '#f4f4f5',
          50: '#fafafa',
        },
        lime: {
          400: '#a3e635',
          600: '#65a30d',
        },
      },
      fontFamily: {
        mono: ['SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
