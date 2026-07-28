/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Clash Display', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0eeff',
          100: '#e0dcff',
          200: '#c5bcff',
          300: 'var(--accent2)',
          400: '#9080f0',
          500: 'var(--accent)',
          600: 'var(--accent-hover)',
          700: '#5040cc',
          800: '#3d30a8',
          900: '#2d2282',
        },
        dark: {
          bg:       'var(--bg)',
          surface1: 'var(--bg1)',
          surface2: 'var(--bg2)',
          surface3: 'var(--bg3)',
          surface4: 'var(--surface)',
          border:   'var(--border)',
          border2:  'var(--border2)',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease both',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scaleIn 0.2s ease both',
        shimmer: 'shimmer 1.6s infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:  { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer:  { '0%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '-100% 50%' } },
      },
    },
  },
  plugins: [],
};
