/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      maxWidth: {
        '7.5xl': '90rem',    // 1440px - between 7xl and 8xl
        '8.5xl': '96rem',    // 1536px - between 8xl and what would be 9xl
        '9xl': '100rem',     // 1600px - custom 9xl size
      },
    },
  },
  plugins: [],
};