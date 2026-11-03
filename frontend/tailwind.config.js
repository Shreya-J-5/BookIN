/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          500: '#f43f5e',
          600: '#e11d48', // Primary cinema ruby red
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        cinema: {
          dark: '#0c0e14',
          card: '#161922',
          border: '#242938',
          subtle: '#8e96a8',
          gold: '#f59e0b',
          prime: '#3b82f6',
          recliner: '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
