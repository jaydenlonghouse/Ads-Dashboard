/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Brand: Figtree only (no system-ui stack per guidelines)
        sans: ['Figtree', 'sans-serif'],
        mono: ['Figtree', 'sans-serif'],
      },
      letterSpacing: {
        DEFAULT: '0',
      },
      colors: {
        // Longhouse Brand Guidelines 2025 — main palette (hex from guide)
        brand: {
          50: '#EDF4FA', // Tint 1
          100: '#D5E8F7', // Blue 1 / Tint 3
          200: '#C4DEF4',
          300: '#8EBFE8',
          400: '#22BBF2', // Blue 3
          500: '#0898CC', // Accent 1
          600: '#1F5B99', // Blue 2
          700: '#08447F', // Blue 4
          800: '#043566', // Primary deep blue
          900: '#00234D', // Blue 5
          950: '#02163D', // Blue 6
        },
        ink: {
          50: '#F4F8FC',
          100: '#E8F0F8',
          200: '#D5E8F7',
          300: '#B0C4D8',
          400: '#7A8D9E',
          600: '#5C6773',
          800: '#2E3A47',
          900: '#02163D',
        },
      },
    },
  },
  plugins: [],
}
