/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'oklch(0.97 0.04 254)',
          100: 'oklch(0.94 0.07 254)',
          200: 'oklch(0.90 0.09 254)',
          300: 'oklch(0.84 0.13 254)',
          400: 'oklch(0.77 0.15 254)',
          500: 'oklch(0.70 0.18 254)',
          600: 'oklch(0.62 0.21 254)',
          700: 'oklch(0.53 0.22 254)',
          800: 'oklch(0.45 0.19 254)',
          900: 'oklch(0.36 0.15 254)',
          950: 'oklch(0.28 0.12 254)',
        },
      },
    },
  },
  plugins: [],
} 