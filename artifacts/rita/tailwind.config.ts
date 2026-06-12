import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rita: {
          blue: "#1668c8",
          "blue-dark": "#1250a0",
          "blue-light": "#e8f1fc",
          lime: "#b8d400",
          "lime-dark": "#8fa300",
          "lime-light": "#f5fbcc",
          charcoal: "#1e2a38",
          gray: "#6b7a8d",
          "gray-light": "#f4f6f9",
        },
        score: {
          high: "#1668c8",
          mid: "#c89000",
          low: "#c83030",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
