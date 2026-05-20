import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          hover: '#E8C060',
          light: '#E8D5A3',
          pale: '#F5EDD6',
          dark: '#9B7E2E',
        },
        fsl: {
          bg: '#181A20',
          dark: '#0A0C10',
          carbon: '#111318',
          mid: '#1C1E26',
          border: '#2A2D38',
          muted: '#8892A4',
          dim: '#555560',
          black: '#0A0C10',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        condensed: ['Barlow Condensed', 'sans-serif'],
        sans: ['Barlow', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-dot': 'pulseDot 1.4s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '.5', transform: 'scale(1.3)' } },
      },
    },
  },
  plugins: [],
}
export default config
