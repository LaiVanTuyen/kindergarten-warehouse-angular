const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF8FA3', // Soft Pink
          50: '#FFF0F3',
          100: '#FFE3E8',
          200: '#FFC7D1',
          300: '#FFAUB9',
          400: '#FF8FA3',
          500: '#FF637D',
          600: '#E63D5C',
          700: '#C2203F',
          800: '#A11630',
          900: '#851226',
        },
        secondary: {
          DEFAULT: '#8AC4FF', // Sky Blue
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#C2DFFF',
          300: '#A3CFFF',
          400: '#8AC4FF',
          500: '#66AFFF',
          600: '#4094FF',
          700: '#1F7AFF',
          800: '#005CE6',
          900: '#0047B3',
        },
        'soft-pink': '#FF8FA3',
        'sky-blue': '#8AC4FF',
      },
      fontFamily: {
        sans: ['Quicksand', 'Nunito', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-slow': {
          '0%, 100%': {
            transform: 'translateY(-5%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'bounce-slow': 'bounce-slow 3s infinite',
      },
    },
  },
  plugins: [],
};
