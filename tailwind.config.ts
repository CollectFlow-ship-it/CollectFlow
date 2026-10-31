import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1E40AF", dark: "#1B3A9E", soft: "#E2E9FB" },
        ink: "#0F1A2E",
        muted: "#56647D",
        line: "#D6DDEA",
        canvas: "#F2F5FA",
        good: "#15803D",
        bad: "#B91C1C",
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
