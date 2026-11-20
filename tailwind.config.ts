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
        disaster: {
          earthquake: "#DC2626", // Red-600
          tsunami: "#2563EB",    // Blue-600
          typhoon: "#7C3AED",    // Purple-600
          normal: "#16A34A",     // Green-600
          warning: "#EA580C",    // Orange-600
        },
      },
      animation: {
        pulseSlow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        beacon: "beacon 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        siren: "siren 1s infinite alternate",
      },
      keyframes: {
        beacon: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        siren: {
          "0%": { opacity: "0.85" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
