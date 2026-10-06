// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1E4620',      // Verde Bosque
          accent: '#25636B',    // Verde Azulado
          light: '#F9F9F6',     // Blanco Hueso
          text: '#1A1D20',      // Gris Oscuro
          border: '#D1D5DB',
        },
        status: {
          success: '#2E7D32',
          danger: '#C62828',
          warning: '#E65100',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Tipografía moderna e intuitiva
      }
    },
  },
  plugins: [],
}