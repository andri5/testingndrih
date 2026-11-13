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
          DEFAULT: '#0F766E',
          hover: '#0D9488',
          soft: '#CCFBF1',
          ink: '#134E4A',
          hero: '#0E2F30',
          'hero-mid': '#143D3E',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F4F7F7',
          sidebar: '#F7FAFA',
          border: '#D5E0E0',
        },
        ink: {
          DEFAULT: '#12202A',
          muted: '#5B6B73',
          subtle: '#8A9AA2',
        },
        // Legacy aliases → Testiny-like teal (keeps old class names working)
        linear: {
          bg:           '#F4F7F7',
          surface:      '#FFFFFF',
          sidebar:      '#F7FAFA',
          border:       '#D5E0E0',
          accent:       '#0F766E',
          'accent-hover': '#0D9488',
          text:         '#12202A',
          muted:        '#5B6B73',
          subtle:       '#8A9AA2',
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
