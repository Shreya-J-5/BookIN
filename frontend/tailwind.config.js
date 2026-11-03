/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f3',
          100: '#ffe4e8',
          500: '#f84464',
          600: '#e03756', // BookMyShow Primary Red/Pink
          700: '#c52845',
        },
        bms: {
          bg: '#F5F5F5',
          card: '#FFFFFF',
          text: '#222222',
          subtext: '#666666',
          muted: '#888888',
          border: '#E5E5E5',
          borderSubtle: '#EEEEEE',
          red: '#F84464',
          redHover: '#E03756',
          green: '#1EA83C',
          greenHover: '#188E32',
          sold: '#CCCCCC',
          darkNav: '#333545',
          lightNav: '#1F2533',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'bms': '0 1px 4px rgba(0,0,0,0.08)',
        'bms-card': '0 2px 8px rgba(0,0,0,0.08)',
        'bms-dropdown': '0 4px 16px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '10px',
      }
    },
  },
  plugins: [],
}
