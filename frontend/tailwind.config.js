/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D5A936',
          hover: '#C2982B',
          light: '#FBF6EA',
          border: '#E2C36E',
        },
        charcoal: {
          DEFAULT: '#26343C',
          dark: '#1D282E',
          light: '#31424C',
          border: '#3A4C57',
        },
        ink: {
          primary: '#202020',
          secondary: '#666666',
          muted: '#8E8E8E',
        },
        surface: {
          white: '#FFFFFF',
          light: '#F5F5F5',
          border: '#DADADA',
          borderSubtle: '#EEEEEE',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.05)',
        'card': '0 1px 4px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        DEFAULT: '3px',
        'md': '4px',
        'lg': '6px',
      }
    },
  },
  plugins: [],
}
