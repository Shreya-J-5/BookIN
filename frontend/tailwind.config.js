/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navbar: '#1E232A',
        gold: {
          DEFAULT: '#E5B642',
          hover: '#D4A333',
          light: '#FEF9EE',
          border: '#F2D38A',
        },
        charcoal: {
          DEFAULT: '#1E232A',
          dark: '#14181E',
          light: '#2B323C',
          border: '#333C48',
        },
        ink: {
          primary: '#1E232A',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        surface: {
          white: '#FFFFFF',
          light: '#F8F9FA',
          border: '#E2E8F0',
          borderSubtle: '#EDF2F7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.05)',
        'card': '0 2px 6px rgba(0,0,0,0.06)',
        'dropdown': '0 8px 24px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        'none': '0',
        'sm': '3px',
        DEFAULT: '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      }
    },
  },
  plugins: [],
}
