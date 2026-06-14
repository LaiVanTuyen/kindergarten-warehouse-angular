/* =============================================================================
 * KinderWorld — Shared Tailwind preset
 * Maps the CSS design tokens (libs/theme/tokens.css) onto Tailwind's theme so
 * both `portal` and `admin` share one palette + scale, with dark-mode support.
 *
 * Usage (apps/<app>/tailwind.config.js):
 *   module.exports = {
 *     presets: [require('../../libs/theme/tailwind-preset.js')],
 *     content: [...],
 *   };
 * ============================================================================= */

/** Build a `rgb(var(--c-…) / <alpha-value>)` reference so opacity modifiers work. */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

/** Build a full 50–900 ramp from a token prefix. */
const ramp = (prefix, withDefault = '500') => {
  const out = {};
  for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
    // not every ramp defines every step; Tailwind tolerates extra/missing keys
    out[step] = v(`${prefix}-${step}`);
  }
  if (withDefault) out.DEFAULT = v(`${prefix}-${withDefault}`);
  return out;
};

const primary = ramp('primary', '600');
const accent = ramp('accent', '500');
const sun = {
  50: v('sun-50'),
  100: v('sun-100'),
  200: v('sun-200'),
  300: v('sun-300'),
  400: v('sun-400'),
  500: v('sun-500'),
  600: v('sun-600'),
  700: v('sun-700'),
  DEFAULT: v('sun-500'),
};

module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* --- Semantic surfaces / text ----------------------------------- */
        bg: v('bg'),
        surface: {
          DEFAULT: v('surface'),
          2: v('surface-2'),
          3: v('surface-3'),
        },
        line: { DEFAULT: v('line'), strong: v('line-strong') },
        ink: {
          DEFAULT: v('ink'),
          soft: v('ink-soft'),
          muted: v('ink-muted'),
          onbrand: v('ink-onbrand'),
        },

        /* --- Brand ------------------------------------------------------- */
        primary,
        accent,
        sun,

        /* --- Status ------------------------------------------------------ */
        success: { DEFAULT: v('success'), soft: v('success-soft') },
        warning: { DEFAULT: v('warning'), soft: v('warning-soft') },
        danger: { DEFAULT: v('danger'), soft: v('danger-soft') },
        info: { DEFAULT: v('info'), soft: v('info-soft') },

        /* --- Admin sidebar shell ---------------------------------------- */
        sidebar: {
          DEFAULT: v('sidebar'),
          2: v('sidebar-2'),
          fg: v('sidebar-fg'),
          muted: v('sidebar-muted'),
          active: v('sidebar-active'),
        },

        /* =================================================================
         * BACKWARD-COMPAT ALIASES — keep legacy templates rendering (now in
         * the new teal palette) until each is migrated to semantic tokens.
         * Remove once all templates use the tokens above.
         * ================================================================= */
        'primary-pink': v('primary-600'),
        'soft-pink': v('primary-400'),
        secondary: accent, // portal: peach/orange → coral accent
        'sky-blue': v('info'),
        kindy: {
          coral: v('accent-500'),
          'coral-soft': v('accent-200'),
          'coral-strong': v('accent-700'),
          sun: v('sun-500'),
          'sun-soft': v('sun-100'),
          mint: v('primary-400'),
          'mint-soft': v('primary-100'),
          sky: v('info'),
          'sky-soft': v('info-soft'),
          lavender: v('accent-300'),
          cream: v('bg'),
          'surface-soft': v('surface-2'),
          sidebar: v('sidebar'),
          'sidebar-hover': v('sidebar-2'),
          'sidebar-active': v('sidebar-active'),
          ink: v('ink'),
          'ink-soft': v('ink-soft'),
        },
        admin: { navy: v('sidebar'), white: v('surface') },
      },

      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
      },

      borderRadius: {
        xs: 'var(--r-xs)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': 'var(--r-2xl)',
        '3xl': '2rem',
        card: 'var(--r-lg)',
        pill: 'var(--r-pill)',
      },

      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        pop: 'var(--shadow-pop)',
      },

      ringColor: { focus: 'rgb(var(--c-primary-400) / 0.55)' },

      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.45s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'bounce-slow': 'bounce-slow 3s infinite',
      },
    },
  },
  plugins: [],
};
