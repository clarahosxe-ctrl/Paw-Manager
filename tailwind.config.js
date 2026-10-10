const c = (v) => `rgb(var(--${v}) / <alpha-value>)`
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'), card: c('card'), primary: c('primary'), sage: c('sage'),
        ink: c('ink'), muted: c('muted'), line: c('line'), warn: c('warn'),
        ok: c('ok'), onprimary: c('onprimary'),
      },
      borderRadius: { card: '22px', btn: '18px' },
      boxShadow: { soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 14px rgb(0 0 0 / 0.04)' },
      fontFamily: { sans: ['"DM Sans"', 'system-ui', 'sans-serif'], serif: ['"DM Sans"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
