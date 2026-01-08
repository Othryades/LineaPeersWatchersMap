/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        linea: {
          bg: '#0d0f14',
          surface: '#161a22',
          border: '#252a35',
          accent: '#61dafb',
        }
      }
    },
  },
  plugins: [],
}

