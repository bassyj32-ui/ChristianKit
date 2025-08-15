/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ed',
          100: '#fdedd2',
          200: '#fbd7a5',
          300: '#f8bb6d',
          400: '#f59532',
          500: '#f3770a',
          600: '#e45f05',
          700: '#bc4708',
          800: '#95380e',
          900: '#782f0f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
