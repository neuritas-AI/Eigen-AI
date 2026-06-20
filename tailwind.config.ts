import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#2563EB',
          purple: '#7C3AED',
          cyan: '#22D3EE',
          canvas: '#0F172A',
          panel: '#111827',
          surface: '#111827',
          text: '#F8FAFC',
          muted: '#94A3B8',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      boxShadow: {
        glow: '0 24px 80px rgba(15, 23, 42, 0.24)',
        soft: '0 18px 50px rgba(15, 23, 42, 0.18)',
        panel: '0 4px 32px rgba(15, 23, 42, 0.36)',
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at top, rgba(124, 58, 237, 0.18), transparent 30%), radial-gradient(circle at right, rgba(37, 99, 235, 0.18), transparent 25%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
