/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // every colour comes from a CSS variable in index.css, so one attribute on
        // <html> switches the whole palette between the dark and light themes
        bg: 'rgb(var(--bg) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        line: 'rgb(var(--line-c) / var(--line-a))',
        hair: 'rgb(var(--hair-c) / var(--hair-a))',
        onbrand: 'rgb(var(--on-brand) / <alpha-value>)',
        mod: 'rgb(var(--mod) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          hover: 'rgb(var(--brand-hover) / <alpha-value>)',
        },
        zinc: {
          50: 'rgb(var(--z50) / <alpha-value>)',
          200: 'rgb(var(--z200) / <alpha-value>)',
          300: 'rgb(var(--z300) / <alpha-value>)',
          400: 'rgb(var(--z400) / <alpha-value>)',
          500: 'rgb(var(--z500) / <alpha-value>)',
          600: 'rgb(var(--z600) / <alpha-value>)',
          700: 'rgb(var(--z700) / <alpha-value>)',
          800: 'rgb(var(--z800) / <alpha-value>)',
          900: 'rgb(var(--z900) / <alpha-value>)',
          950: 'rgb(var(--z950) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
