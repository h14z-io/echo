/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#fef2f4',
          100: '#fde5ea',
          200: '#fac8d5',
          300: '#f5a0b7',
          400: '#f07593',
          500: '#e84d6e',
          600: '#BB2649', // Viva Magenta
          700: '#9E203D',
          800: '#7E1D33',
          900: '#6B1B2E',
          950: '#3D0D19',
          DEFAULT: '#BB2649',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
