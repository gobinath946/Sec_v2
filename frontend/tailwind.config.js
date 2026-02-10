/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#FFFFFF',
        accent: '#000000'
      }
    }
  },
  plugins: []
};
