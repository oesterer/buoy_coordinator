/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        harbor: '#0f766e',
        signal: '#f59e0b'
      }
    }
  },
  plugins: []
};
