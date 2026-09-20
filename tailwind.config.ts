import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#fff9eb",
        ink: "#262822",
        yellow: "#f5e89e",
        pink: "#f3aac7",
        line: "#d9d6c9",
        muted: "#5c6055",
        rose: "#8d355b",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      letterSpacing: {
        tightest: "-0.175em",
        tighter: "-0.125em",
        tight: "-0.05em",
      },
    },
  },
  plugins: [],
};

export default config;
