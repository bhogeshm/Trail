import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0b",
        paper: "#f4f1ea",
        gold: "#c9a15a",
        rust: "#8a5a3b",
        mist: "#8a877f",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      letterSpacing: {
        widest2: "0.35em",
      },
    },
  },
  plugins: [],
};

export default config;
