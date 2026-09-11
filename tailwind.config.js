/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080808',
        card: '#09090b',
        line: 'rgba(39,39,42,0.6)',
        brand: { DEFAULT: '#00ef5c', hover: '#6bff9f' },
        // secondary text raised to >= 4.5:1 on the card surface
        zinc: { 500: '#84848e', 600: '#7c7c86' },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
