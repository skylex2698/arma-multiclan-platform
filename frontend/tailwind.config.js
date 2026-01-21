/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tema Claro (Comando Diurno)
        primary: {
          50: '#f5f7ed',
          100: '#e8ecd4',
          200: '#d4d9b0',
          300: '#b8c183',
          400: '#9ea95d',
          500: '#7f8f42',
          600: '#637133',
          700: '#4d582b',
          800: '#404826',
          900: '#373e24',
          950: '#1d2110',
        },
        // Verde Militar para modo oscuro
        tactical: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Verde militar oscuro
        military: {
          50: '#f6f7f4',
          100: '#e3e6dc',
          200: '#c7cdba',
          300: '#a6ae91',
          400: '#8a936f',
          500: '#6f7756',
          600: '#585f44',
          700: '#464b37',
          800: '#3a3e2f',
          900: '#32352a',
          950: '#1a1c15',
        },
        // Acento Naranja/Arena
        accent: {
          50: '#fef9ee',
          100: '#fdefd1',
          200: '#fbdca2',
          300: '#f8c368',
          400: '#f5a93c',
          500: '#f28d1e',
          600: '#e37013',
          700: '#bc5312',
          800: '#964117',
          900: '#793716',
          950: '#411a08',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        military: ['"Orbitron"', '"Rajdhani"', 'sans-serif'], // Fuentes militares opcionales
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
        'tactical-gradient': 'linear-gradient(135deg, #2D4A2B 0%, #1a2e1a 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};