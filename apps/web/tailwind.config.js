/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // GDK Brand Colors
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1A56A0',
          800: '#1E3A5F',
          900: '#1E2D4A',
          DEFAULT: '#1A56A0',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F97316',
          foreground: '#FFFFFF',
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          600: '#EA6C00',
        },
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          foreground: '#FFFFFF',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          foreground: '#FFFFFF',
        },
        // Status badges
        status: {
          active: '#10B981',
          expiring: '#F59E0B',
          expired: '#EF4444',
          archived: '#94A3B8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        elevated: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)',
        modal: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04)',
        glow: '0 0 20px rgba(26,86,160,0.15)',
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'skeleton': 'skeleton 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(26,86,160,0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(26,86,160,0.5)' },
        },
        skeleton: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}
