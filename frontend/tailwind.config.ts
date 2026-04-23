import type { Config } from "tailwindcss";

/**
 * Квиз.Лайв дизайн-токены (light VK-style).
 * Источник правды — handoff bundle из Claude Design
 * (vk-quiz/project/styles.css). Держи в lockstep с src/styles/tokens.css.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          page:    "#EBEEF2",
          surface: "#FFFFFF",
          muted:   "#F2F4F7",
          hover:   "#E8ECF1",
          sidebar: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#0077FF",
          hover:   "#0066DB",
          soft:    "#E5F0FF",
          softer:  "#F0F6FF",
        },
        success: { DEFAULT: "#4BB34B", soft: "#E6F4E6" },
        warning: { DEFAULT: "#FF9900", soft: "#FFF4E0" },
        danger:  { DEFAULT: "#E64646", soft: "#FCE9E9" },
        gold:    "#FFB922",
        silver:  "#B4BEC7",
        bronze:  "#D08B5A",
        text: {
          primary:     "#0D1A2B",
          secondary:   "#6D7885",
          tertiary:    "#99A2AD",
          "on-accent": "#FFFFFF",
          placeholder: "#B8C1CC",
        },
        border: {
          DEFAULT: "rgba(13, 26, 43, 0.08)",
          strong:  "rgba(13, 26, 43, 0.14)",
        },
        divider: "rgba(13, 26, 43, 0.06)",
      },
      fontFamily: {
        ui:      ["Inter", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        display: ["Manrope", "Inter", "sans-serif"],
        mono:    ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xs:   "8px",
        sm:   "10px",
        md:   "14px",
        lg:   "20px",
        xl:   "28px",
        pill: "999px",
      },
      boxShadow: {
        card:    "0 1px 0 rgba(13,26,43,0.04), 0 2px 8px rgba(13,26,43,0.04)",
        elev:    "0 4px 16px rgba(13,26,43,0.08)",
        pop:     "0 8px 32px rgba(13,26,43,0.12)",
        accent:  "0 8px 24px rgba(0,119,255,0.28)",
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(135deg, #0077FF 0%, #1E90FF 60%, #5EB0FF 100%)",
        "gradient-lobby": "linear-gradient(140deg, #F0F6FF 0%, #EBEEF2 60%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
