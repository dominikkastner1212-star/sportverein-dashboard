/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: {
          0: '#ffffff',
          1: '#f7f7f5',
          2: '#eeeeeb',
          3: '#deded8',
        },
        ink: {
          DEFAULT: '#101010',
          2: '#181818',
          3: '#262626',
          muted: '#64615c',
          subtle: '#928f87',
          faint: '#c8c4ba',
        },
        accent: {
          DEFAULT: '#d71920',
          light: '#fde8e9',
          dark: '#a90f16',
        },
        brand: {
          gold: '#d9a828',
          'gold-dark': '#b88a17',
          blue: '#28509e',
          'blue-dark': '#1a3568',
          navy: '#15294a',
        },
        belt: {
          white: '#e5e7eb',
          yellow: '#eab308',
          orange: '#f97316',
          green: '#16a34a',
          blue: '#2563eb',
          brown: '#92400e',
          black: '#111110',
          red: '#dc2626',
        },
        status: {
          active: '#16a34a',
          paused: '#d97706',
          left: '#9b9a97',
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)',
        'modal': '0 20px 60px -10px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
