/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        huda: {
          green: '#1a6b4a',
          gold: '#c9a84c',
          dark: '#0f1f17',
          light: '#f0f7f4',
        }
      }
    }
  },
  plugins: [],
}
