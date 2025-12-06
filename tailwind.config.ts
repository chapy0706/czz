// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"], // ← ここだけ重要
  content: [
    "./apps/**/*.{ts,tsx}",
    "./packages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};

export default config;
