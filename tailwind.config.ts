import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          primary: 'hsl(234 89% 74%)',
          secondary: 'hsl(271 91% 65%)',
          accent: 'hsl(162 100% 50%)',
          gold: 'hsl(43 96% 56%)',
        },
        surface: {
          base: 'hsl(220 27% 5%)',
          card: 'hsl(222 25% 8%)',
          elevated: 'hsl(223 22% 12%)',
          overlay: 'hsl(224 20% 16%)',
        },
        border: {
          subtle: 'hsl(220 20% 18%)',
          default: 'hsl(220 18% 22%)',
          strong: 'hsl(220 16% 30%)',
        },
        text: {
          primary: 'hsl(210 40% 96%)',
          secondary: 'hsl(215 25% 65%)',
          muted: 'hsl(220 15% 45%)',
        },
        status: {
          success: 'hsl(142 71% 45%)',
          warning: 'hsl(38 100% 56%)',
          danger: 'hsl(0 84% 60%)',
          info: 'hsl(199 89% 48%)',
        }
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, hsl(234 89% 74%), hsl(271 91% 65%))',
        'gradient-accent': 'linear-gradient(135deg, hsl(162 100% 50%), hsl(234 89% 74%))',
        'gradient-gold': 'linear-gradient(135deg, hsl(43 96% 56%), hsl(38 100% 56%))',
        'gradient-surface': 'linear-gradient(135deg, hsl(222 25% 8% / 0.8), hsl(223 22% 12% / 0.6))',
      },
      boxShadow: {
        'glow-primary': '0 0 40px hsl(234 89% 74% / 0.25)',
        'glow-accent': '0 0 40px hsl(162 100% 50% / 0.2)',
        'glow-gold': '0 0 40px hsl(43 96% 56% / 0.25)',
        'glow-danger': '0 0 40px hsl(0 84% 60% / 0.3)',
        'card': '0 4px 24px hsl(0 0% 0% / 0.3)',
        'card-hover': '0 8px 32px hsl(0 0% 0% / 0.4)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'fade-in': 'fade-in 0.4s ease forwards',
        'spin-slow': 'spin 8s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-danger': 'pulse-danger 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px hsl(234 89% 74% / 0.3)' },
          '50%': { boxShadow: '0 0 40px hsl(234 89% 74% / 0.6)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'pulse-danger': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
