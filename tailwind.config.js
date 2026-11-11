/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium brand colors
        midnight: {
          50: '#f8f7ff',
          100: '#f0ecff',
          200: '#e6deff',
          300: '#d4c5ff',
          400: '#b8a8ff',
          500: '#9d88ff',
          600: '#7d5fff',
          700: '#6b46c1',
          800: '#3b2667',
          900: '#1a1a2e',
          950: '#0f0f1e',
        },
        lavender: {
          50: '#faf9ff',
          100: '#f3f0ff',
          200: '#ede7ff',
          300: '#dcd5ff',
          400: '#c7b5ff',
          500: '#b8a8ff',
          600: '#9d88ff',
          700: '#8674ff',
          800: '#6d55d2',
          900: '#5a45a8',
        },
        charcoal: {
          50: '#f8f8f9',
          100: '#f0f0f2',
          200: '#e0e0e5',
          300: '#c8c8d1',
          400: '#a8a8b5',
          500: '#888894',
          600: '#6d6d78',
          700: '#555560',
          800: '#3d3d44',
          900: '#2d2d34',
          950: '#1a1a1f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(157, 136, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(157, 136, 255, 0.2)',
        'glass': '0 8px 32px rgba(31, 38, 135, 0.15)',
        'glass-lg': '0 16px 64px rgba(31, 38, 135, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(157, 136, 255, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(157, 136, 255, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
