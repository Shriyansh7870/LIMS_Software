/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary accent — amber/gold (replaces teal everywhere via same token names)
        teal: {
          DEFAULT: '#C49A2C',
          dark:    '#A67D16',
          light:   '#DDB84A',
          50:  '#FEFCE8',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#C49A2C',
          600: '#A67D16',
          700: '#8B6514',
          800: '#6B4E10',
          900: '#4A360B',
        },
        // Layout surfaces
        surface: '#FFFFFF',
        bg:      '#F4F6F9',
        card:    '#FFFFFF',
        card2:   '#F0F2F7',
        border:  '#E2E8F0',
        border2: '#CBD5E1',
        sidebar: '#0D1117',
        // Typography
        text: {
          DEFAULT: '#0F172A',
          muted:   '#64748B',
          dim:     '#94A3B8',
        },
        // Semantic
        risk: {
          high:   '#DC2626',
          medium: '#D97706',
          low:    '#16A34A',
        },
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      boxShadow: {
        card:       '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'card-hover': '0 4px 16px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)',
        teal:       '0 4px 14px rgba(196,154,44,0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
