/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tronco: {
          green: '#1E4620',
          darkgreen: '#0f2a11',
          brown: '#48250D',
          orange: '#E65100',
          red: '#C62828',
          bg: '#F1F2EE',
          card: '#FFFFFF'
        }
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}