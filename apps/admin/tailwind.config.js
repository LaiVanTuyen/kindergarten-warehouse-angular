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
        // Kindergarten palette — warm, playful, yet professional.
        kindy: {
          // Primary (soft coral/pink)
          coral: '#FB7185',
          'coral-soft': '#FECDD3',
          'coral-strong': '#E11D48',
          // Accents
          sun: '#FBBF24',
          'sun-soft': '#FEF3C7',
          mint: '#34D399',
          'mint-soft': '#D1FAE5',
          sky: '#60A5FA',
          'sky-soft': '#DBEAFE',
          lavender: '#C4B5FD',
          // Surfaces
          cream: '#FFF7ED',
          'surface-soft': '#FAF5FF',
          // Sidebar (warm deep indigo/violet, friendlier than navy)
          sidebar: '#312E81',
          'sidebar-hover': '#3730A3',
          'sidebar-active': '#F472B6',
          // Text
          ink: '#1F1A37',
          'ink-soft': '#6B6684',
        },
        // Legacy tokens kept to avoid breaking existing templates.
        admin: {
          navy: '#312E81',
          white: '#FFFFFF',
        },
        'primary-pink': '#F472B6',
      },
      fontFamily: {
        sans: ['Quicksand', 'Nunito', 'sans-serif'],
        display: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
