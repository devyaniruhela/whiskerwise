import type { Config } from "tailwindcss";
import designSystem from "./config/design-system.json";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: designSystem.colors.primary,
        secondary: designSystem.colors.secondary,
        emerald: designSystem.colors.emerald,
        gray: designSystem.colors.gray,
        red: designSystem.colors.red,
        blue: designSystem.colors.blue,
        amber: designSystem.colors.amber,
        green: designSystem.colors.green,
      },
      fontFamily: {
        serif: ['Prata', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: designSystem.borderRadius,
      boxShadow: designSystem.shadows,
      spacing: designSystem.spacing,
      transitionDuration: designSystem.transitions.duration,
      transitionTimingFunction: designSystem.transitions.timing,
      backgroundImage: {
        'gradient-primary': designSystem.gradients.primary,
        'gradient-warm': designSystem.gradients.warm,
        'gradient-cool': designSystem.gradients.cool,
      },
      animation: {
        'spin': 'spin 1s linear infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'dash': 'dash 2s linear infinite',
      },
      keyframes: {
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        ping: {
          '75%, 100%': { 
            transform: 'scale(2)', 
            opacity: '0' 
          },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        bounce: {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        dash: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
