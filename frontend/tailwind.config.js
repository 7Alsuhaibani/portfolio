/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#07080d',
          900: '#0d0f17',
          850: '#111420',
          800: '#181b27',
          750: '#1e2130',
          700: '#252839',
          600: '#374151',
          500: '#6b7280',
          400: '#9ca3af',
          300: '#d1d5db',
        },
        blue: {
          600: '#2563eb',
          500: '#3b82f6',
          400: '#60a5fa',
        },
        cyan: { 400: '#22d3ee', 500: '#06b6d4' },
        emerald: { 400: '#34d399', 500: '#10b981' },
        amber: { 400: '#fbbf24' },
        red: { 400: '#f87171', 500: '#ef4444' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
