/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Hunhar Brand Colors
        navy: {
          DEFAULT: '#0A1B37',
          50: '#d0dcfb',
          100: '#aac0fe',
          200: '#a3b9f8',
          300: '#728fea',
          400: '#3652ba',
          500: '#1b3bbb',
          600: '#24388a',
          700: '#1B254B',
          800: '#111c44',
          900: '#0A1B37',
        },
        beige: '#B7AA9A',
        ivory: '#F3EFE6',
        gold: '#CBA96B',
        terracotta: {
          DEFAULT: '#C06B3E',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#C06B3E',
          600: '#AA572D',
          700: '#94441F',
        },
        // Client Brand Colors (from hunhar-app/client)
        'brand-primary': '#FF1744',
        'brand-secondary': '#00C853',
        'brand-red': '#FF1744',
        'brand-green': '#00C853',
        'brand-dark': '#01152B',
        'brand-light': '#F4F7FA',
        primary: {
          DEFAULT: '#FF1744',
          dark: '#D50000',
          light: '#FF5252',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        makira: ['Makira', 'Inter', 'sans-serif'],
        manrope: ['Manrope', 'sans-serif'],
        bricolage: ['"Bricolage Grotesque"', 'Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 35s linear infinite',
        'marquee-reverse': 'marquee-reverse 35s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
      boxShadow: {
        'horizon': '0px 18px 40px rgba(112, 144, 176, 0.12)',
        '3xl': '14px 17px 40px 4px rgba(112, 144, 176, 0.08)',
      },
      borderRadius: {
        'primary': '20px',
      },
    },
  },
  plugins: [],
}
