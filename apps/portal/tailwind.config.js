const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../libs/theme/tailwind-preset.js')],
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
  // Theme (colors, fonts, radius, shadows, animations) comes from the shared
  // preset in libs/theme. Add app-specific overrides here if ever needed.
};
