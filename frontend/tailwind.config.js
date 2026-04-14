/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {

      /* ✅ FORCE INTER AS DEFAULT FONT */
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },

      /* EY COLORS */
      colors: {
        ey: {
          yellow: "#FFE600",
          black: "#2E2E2E",
          charcoal: "#1A1A1B",
          gold: "#C4A000",
          light: "#F4F4F4",
        },
      },

      /* ANIMATIONS */
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },

        slideUp: {
          '0%': {
            transform: 'translateY(10px)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          },
        },
      },

    },
  },

  plugins: [],
}
