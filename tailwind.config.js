/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F8F3EB',
        espresso: '#38251F',
        chocolate: '#754B3A',
        rose: '#DFAE9B',
        gold: '#C6A46C',
        cream: '#FFFDF8',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Manrope"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        editorial: '0.22em',
        luxe: '0.14em',
      },
      boxShadow: {
        editorial: '0 24px 60px -15px rgba(56, 37, 31, 0.14)',
        card: '0 14px 40px -12px rgba(56, 37, 31, 0.10)',
      },
    },
  },
  plugins: [],
};
