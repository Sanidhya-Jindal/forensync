/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        matter: ['"Matter"', '"Matter SQ"', 'system-ui', 'sans-serif'],
        mono: ['"Matter Mono"', 'monospace'],
      },
      colors: {
        warp: {
          bg: '#0D0D0D',
          'bg-secondary': '#1A1A1A',
          'bg-card': '#262626',
          'bg-elevated': '#2D2D2D',
          border: '#333333',
          'border-subtle': '#262626',
          'text-primary': '#F5F5F7',
          'text-secondary': '#B4B4BE',
          'text-muted': '#8A8A92',
          'accent-coral': '#F87171',
          'accent-pink': '#EC4899',
          'accent-purple': '#A855F7',
          'accent-blue': '#3B82F6',
          'accent-green': '#10B981',
        },
      },
    },
  },
  plugins: [],
};
