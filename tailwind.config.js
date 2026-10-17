/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#09090b',
        muted: {
          DEFAULT: '#f4f4f5',
          foreground: '#71717a',
        },
        border: '#e4e4e7',
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#0f172a',
          600: '#020617',
          DEFAULT: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
