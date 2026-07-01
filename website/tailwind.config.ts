import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          900: '#04110b',
          800: '#061711',
          700: '#0b2418',
          600: '#0e2f20',
          500: '#123d2a'
        },
        brass: {
          300: '#e8ce84',
          400: '#d9bc6a',
          500: '#c9a24a',
          600: '#a8812f',
          700: '#8a6a24'
        },
        cream: '#f4efe2',
        'cream-dim': '#cfc6ad'
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'Times New Roman', 'serif'],
        body: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
