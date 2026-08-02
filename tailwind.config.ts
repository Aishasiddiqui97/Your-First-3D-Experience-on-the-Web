import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        plum: {
          DEFAULT: "#0F0B1F",
          light: "#1A1430",
          dark: "#080614",
        },
        teal: {
          DEFAULT: "#00E5C4",
        },
        gold: {
          DEFAULT: "#C8A24A",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
