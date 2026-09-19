/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        alice: {
          50: '#f8fafc',
          100: '#F0F8FF', // Alice Blue base
          200: '#e0f2fe',
          300: '#bae6fd',
          400: '#7dd3fc',
          500: '#38bdf8',
          600: '#0284c7',
        },
        grey: {
          950: '#0d0f12',
          900: '#14171d',
          850: '#1a1e26',
          800: '#222731',
          750: '#2a303d',
          700: '#373e4f',
          600: '#4b5568',
          500: '#64748b',
          400: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
