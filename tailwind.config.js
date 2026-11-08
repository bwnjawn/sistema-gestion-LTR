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
        // Atkinson Hyperlegible, autoalojada (ver src/main.ts)
        sans: ['Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
      },
      // Utilidades que el código usa con nombres de Tailwind v4; aquí se definen para la v3.
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        '2xs': '0 1px rgb(0 0 0 / 0.05)',
      },
      backdropBlur: {
        xs: '4px',
      },
      scale: {
        98: '0.98',
      }
    },
  },
  plugins: [],
}