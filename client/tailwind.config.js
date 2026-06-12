/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        earth: {
          50: '#fdf8f0',
          100: '#faefd9',
          200: '#f5ddb0',
          300: '#ecc57e',
          400: '#e0a44a',
          500: '#d4882a',
          600: '#b86d20',
          700: '#98541c',
          800: '#7c431d',
          900: '#66381a',
        },
      },
    },
  },
  plugins: [],
};
