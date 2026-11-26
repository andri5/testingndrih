/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        brand: {
          DEFAULT: '#0E7490',
          hover: '#0891B2',
          soft: '#E0F2F5',
          ink: '#155E75',
          hero: '#0B1F2A',
          'hero-mid': '#123044',
        },
        accent: {
          DEFAULT: '#1E3A5F',
          hover: '#152C48',
          soft: '#E8EEF4',
          ink: '#1E3A5F',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F4F7FA',
          sidebar: '#EEF2F6',
          border: '#D5DEE7',
        },
        ink: {
          DEFAULT: '#0F1C2E',
          muted: '#5A6B7D',
          subtle: '#8494A7',
        },
        // Legacy aliases → Lab QA cool
        linear: {
          bg:           '#F4F7FA',
          surface:      '#FFFFFF',
          sidebar:      '#EEF2F6',
          border:       '#D5DEE7',
          accent:       '#0E7490',
          'accent-hover': '#0891B2',
          text:         '#0F1C2E',
          muted:        '#5A6B7D',
          subtle:       '#8494A7',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'hero-in':  'heroIn 0.55s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        heroIn: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
