const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  safelist: [
    // Safelist gradient color classes for dynamic banner backgrounds
    {
      pattern:
        /^from-(pink|rose|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|slate|gray)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
    {
      pattern:
        /^to-(pink|rose|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|slate|gray)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF8FA3', // Soft Pink
          50: '#FFF0F3',
          100: '#FFE3E8',
          200: '#FFC7D1',
          300: '#FFABBD',
          400: '#FF8FA3',
          500: '#FF637D', // Hot Pink
          600: '#E63D5C',
          700: '#C2203F',
          800: '#A11630',
          900: '#851226',
        },
        secondary: {
          DEFAULT: '#FFB38A', // Peach/Orange
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C', // Dark Orange
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        'primary-pink': '#FF637D', // Explicitly defined for gradients/text
        'soft-pink': '#FF8FA3',
        'sky-blue': '#8AC4FF', // Keeping reference if needed but unused
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
