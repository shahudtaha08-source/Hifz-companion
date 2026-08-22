import type { Config } from "tailwindcss";

// Design intent: peaceful, minimal, Islamic-but-restrained, high legibility for
// Arabic text. Colors are deliberately muted (no bright/gamified palette).
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: {
          light: "#FBF8F2",
          dark: "#0F1512",
        },
        ink: {
          light: "#1C2521",
          dark: "#E7E4DA",
        },
        brand: {
          50: "#f0f5f1",
          100: "#dbe8dd",
          200: "#b7d1bc",
          300: "#8fb695",
          400: "#699a71",
          500: "#4c7d55",
          600: "#3a6342",
          700: "#2f4f36",
          800: "#28402c",
          900: "#213526",
          950: "#101d15",
        },
        gold: {
          400: "#c9a24b",
          500: "#b48c34",
          600: "#93712a",
        },
      },
      fontFamily: {
        arabic: ["var(--font-arabic)", "Traditional Arabic", "serif"],
        ui: ["var(--font-ui)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        reader: "48rem",
      },
    },
  },
  plugins: [],
};

export default config;
