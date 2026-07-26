import type { Config } from "tailwindcss";

// Canonical values: design/tokens.json (hex authoritative). Do not re-decide them here.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./constants/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: "#292C2C",
        seashell: "#FFF8F2",
        paper: "#FFFDFB",
        emerald: { DEFAULT: "#08513D", deep: "#063C2D", bright: "#0C7355", tint: "#E6EFEA" },
        petal: { DEFAULT: "#FFD7DC", deep: "#F6C2C9" },
        iron: { DEFAULT: "#A02A18", deep: "#7E2113", tint: "#F4E4E1" },
        ochre: { DEFAULT: "#A34700", deep: "#7C3600", tint: "#F3E7DC" },
        sel: "#F5E7CF",
        ink: { DEFAULT: "#292C2C", muted: "#57544E", faint: "#6E6A63" },
        hairline: { DEFAULT: "rgba(41,44,44,0.14)", strong: "rgba(41,44,44,0.28)" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        hand: ["var(--font-hand)", "cursive"],
      },
      borderRadius: { sm: "5px", DEFAULT: "7px", md: "7px", lg: "10px" },
      boxShadow: {
        raised: "0 1px 2px rgba(41,44,44,0.06), 0 6px 18px rgba(41,44,44,0.10)",
        "raised-lg": "0 2px 4px rgba(41,44,44,0.07), 0 14px 34px rgba(41,44,44,0.14)",
        pressed: "inset 0 2px 4px rgba(41,44,44,0.18)",
      },
      transitionTimingFunction: { out: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      zIndex: {
        dropdown: "100",
        sticky: "200",
        backdrop: "300",
        modal: "310",
        toast: "400",
        tooltip: "500",
      },
      keyframes: {
        "stamp-down": {
          "0%": { transform: "scale(1.6) rotate(-14deg)", opacity: "0" },
          "60%": { transform: "scale(0.96) rotate(-7deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-8deg)", opacity: "1" },
        },
        "fade-up": {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pop: {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "60%": { transform: "scale(1.12)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        nudge: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(3px)" },
        },
      },
      animation: {
        "stamp-down": "stamp-down 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "fade-up": "fade-up 300ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        pop: "pop 250ms cubic-bezier(0.16, 1, 0.3, 1) both",
        nudge: "nudge 800ms ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
export default config;
