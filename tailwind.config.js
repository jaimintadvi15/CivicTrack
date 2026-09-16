/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mat: {
          primary: '#4285F4', // Google Blue
          primaryDark: '#1A73E8', // Google Blue Darker
          secondary: '#34A853', // Google Green
          secondaryDark: '#1E8E3E', // Google Green Darker
          surface: '#FFFFFF', // Google White
          bg: '#F8F9FA', // Google Background Gray
          critical: '#EA4335', // Google Red
          high: '#F9AB00', // Google Deeper Yellow / Orange
          medium: '#FBBC05', // Google Yellow
          low: '#4285F4', // Google Blue
          text: {
            primary: '#202124', // Google Near Black
            secondary: '#5F6368', // Google Gray
          },
          border: '#DADCE0', // Google Border Gray
        },
        google: {
          blue: '#4285F4',
          blueDark: '#1A73E8',
          blueLight: '#E8F0FE',
          red: '#EA4335',
          redDark: '#D93025',
          redLight: '#FCE8E6',
          yellow: '#FBBC05',
          yellowDark: '#F29900',
          yellowLight: '#FEF7E0',
          yellowDeep: '#F9AB00',
          green: '#34A853',
          greenDark: '#1E8E3E',
          greenLight: '#E6F4EA',
          bg: '#F8F9FA',
          surface: '#FFFFFF',
          text: '#202124',
          textSecondary: '#5F6368',
          border: '#DADCE0',
        },
        navy: {
          50: '#f0f6fc',
          100: '#e1ecf8',
          200: '#c3dbf2',
          300: '#94c0e8',
          400: '#5e9fdb',
          500: '#3980ce',
          600: '#2566b6',
          700: '#1d5194',
          800: '#1a447a',
          900: '#0B132B',
          950: '#050A17',
        },
        civic: {
          primary: '#4285F4',
          secondary: '#1A73E8',
          accent: '#34A853',
          gold: '#FBBC05',
          amber: '#F9AB00',
          crimson: '#EA4335',
        }
      },
      fontFamily: {
        sans: ['Roboto', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        'elevation-2': '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        'elevation-3': '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
        'elevation-4': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
        'elevation-6': '0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12), 0 3px 5px -1px rgba(0,0,0,0.20)',
        'elevation-8': '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
      },
      borderRadius: {
        'mat': '4px',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    },
  },
  plugins: [],
}
