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
          primary: "#f97316",
          "primary-dark": "#ea580c",
          "primary-light": "#fff7ed",
          // Legacy aliases — kept so existing rita-blue classes render orange
          blue: "#f97316",
          "blue-dark": "#ea580c",
          "blue-light": "#fff7ed",
          secondary: "#1e2a38",
          lime: "#b8d400",
          "lime-dark": "#8fa300",
          "lime-light": "#f5fbcc",
          charcoal: "#1e2a38",
          gray: "#6b7a8d",
          "gray-light": "#f4f6f9",
        },
        score: {
          high: "#f97316",
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
