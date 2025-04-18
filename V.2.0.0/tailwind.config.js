/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef1ff',
          100: '#e0e5ff',
          200: '#c7d0ff',
          300: '#a5b3ff',
          400: '#8494ff',
          500: '#3c57fa',
          600: '#3449e6',
          700: '#2c3ccc',
          800: '#2531a3',
          900: '#1f2980',
        },
      },
    },
  },
  plugins: [],
};