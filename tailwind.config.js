/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        dhyanaBlue: '#0b5ea8',
        dhyanaOrange: '#f36b21',
      },
      boxShadow: {
        soft: '0 18px 55px rgba(15, 23, 42, 0.10)',
        premium: '0 22px 70px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};
