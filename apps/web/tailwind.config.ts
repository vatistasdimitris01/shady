import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        shady: {
          bg: '#0a0a0a',
          surface: '#141414',
          border: '#1f1f1f',
          accent: '#a3e635',
          accentDim: '#65a30d',
          muted: '#525252',
          text: '#e5e5e5',
        },
      },
    },
  },
  plugins: [],
};
export default config;
