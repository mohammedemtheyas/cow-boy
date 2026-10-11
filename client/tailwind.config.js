/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060913',
          900: '#0B0F19',
          850: '#0E1424',
          800: '#131B2E',
          700: '#1E293B',
          600: '#334155',
        },
        lavender: {
          50: '#FAF8FF',
          100: '#F3F0FF',
          200: '#E9E3FF',
          300: '#D8CEFE',
          400: '#BDB0FD',
          500: '#9F88FC',
        },
        violet: {
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          glow: '#A855F7',
        },
        electric: {
          DEFAULT: '#6366F1',
          light: '#818CF8',
          cyan: '#06B6D4',
        },
        surface: {
          card: '#111827',
          cardSubtle: '#151D30',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(139, 92, 246, 0.35)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-violet': '0 0 25px -5px rgba(124, 58, 237, 0.35)',
        'glow-subtle': '0 0 15px 0 rgba(139, 92, 246, 0.15)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
};
