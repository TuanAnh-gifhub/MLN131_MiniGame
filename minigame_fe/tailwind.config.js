/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7db',
          100: '#fee9a3',
          300: '#f8c851',
          500: '#f0b429',
          600: '#d18b11',
        },
        crimson: {
          500: '#b91c1c',
          700: '#7f1d1d',
          900: '#450a0a',
        },
      },
    },
  },
  plugins: [],
}
