/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // Traffic-light tone classes are built from data (`tone-${band}`), so Tailwind cannot see them in source.
  safelist: ['tone-green', 'tone-yellow', 'tone-red', 'tone-gray'],
  theme: {
    extend: {
      // Add your custom colors, fonts, etc. here
    },
  },
  plugins: [],
}

