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
        'xs': '320px',  // Extra small devices (mobile)
        'sm': '640px',  // Small devices (mobile landscape, tablet)
        'md': '768px',  // Medium devices (tablet)
        'lg': '1024px', // Large devices (desktop)
        'xl': '1280px', // Extra large devices (desktop wide)
        '2xl': '1536px', // 2X large devices
      },
      colors: {
        linear: {
          bg:           '#0F0E11',
          surface:      '#1A1A1C',
          sidebar:      '#161618',
          border:       'rgba(255,255,255,0.06)',
          accent:       '#5E6AD2',
          'accent-hover': '#6B7AE8',
          text:         '#E0E0E2',
          muted:        '#8A8A8F',
          subtle:       '#4A4A52',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
