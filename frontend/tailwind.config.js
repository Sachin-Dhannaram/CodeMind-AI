/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0b0f17',
          card: '#131b2a',
          sidebar: '#0e1420',
          border: '#1f293d',
          hover: '#1a2436'
        },
        brand: {
          cyan: '#00f2fe',
          blue: '#4facfe',
          purple: '#7000ff',
          pink: '#f107a3'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 242, 254, 0.35)',
        'glow-purple': '0 0 20px rgba(112, 0, 255, 0.35)'
      }
    },
  },
  plugins: [],
}
