import type { Config } from "tailwindcss";

/**
 * Nebula Quiz design tokens. Values come from Figma node 1:776
 * ("Results & Leaderboard", 2026-04-17) — the palette is intentionally
 * warmer and softer than Tailwind defaults. Do NOT substitute `violet-500`
 * / `slate-950` etc. Keep this file in lockstep with src/styles/tokens.css.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0C0C1F",
          secondary: "#12132B",
          card: "#111128",
          elevated: "#222247",
          input: "#0F1127",
        },
        primary: {
          400: "#A68CFF",
          500: "#7C4DFF",
          600: "#6B3FEB",
          DEFAULT: "#7C4DFF",
        },
        accent: {
          cyan: "#8DCDFF",
          amber: "#FFB778",
          orange: "#FB923C",
          success: "#34D399",
          error: "#EF4444",
        },
        text: {
          primary: "#E5E3FF",
          secondary: "#A8A7D5",
          muted: "#8B8FB8",
          placeholder: "#5C5E85",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.06)",
          DEFAULT: "rgba(68, 68, 108, 0.30)",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "sans-serif"],
        body: ["Plus Jakarta Sans", "ui-sans-serif", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        mega: ["120px", { lineHeight: "1", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "3xl": "32px",
        "2xl": "48px",
        pill: "9999px",
      },
      boxShadow: {
        "glow-primary": "0 10px 20px 0 rgba(166, 139, 255, 0.20)",
        "row-elevated": "0 10px 20px 0 rgba(0, 0, 0, 0.30)",
        podium: "0 20px 40px 0 rgba(0, 0, 0, 0.50)",
        "podium-gold": "0 20px 40px 0 rgba(166, 139, 255, 0.20)",
        card: "0 4px 24px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)",
        "gradient-logo": "linear-gradient(168deg, #A68CFF 0%, #7C4DFF 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
