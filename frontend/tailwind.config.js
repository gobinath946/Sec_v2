/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          50: '#FFE8E0',
          100: '#FFD4C7',
          200: '#FFAD95',
          300: '#FF8663',
          400: '#FF6B35',
          500: '#FF4500',
          600: '#CC3700',
          700: '#992900',
          800: '#661B00',
          900: '#330E00',
        },
        accent: {
          DEFAULT: '#000000',
          light: '#333333',
          lighter: '#666666',
        },
      },
    },
  },
  plugins: [],
}
