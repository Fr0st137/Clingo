import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clingo: {
          blue: "#0985e4",
          blueDark: "#0477d7",
          ink: "#26364a",
          muted: "#7a8798",
          line: "#e2ebf5",
          panel: "#ffffff"
        }
      },
      boxShadow: {
        figma: "0 18px 42px rgba(35, 77, 126, 0.11)",
        soft: "0 10px 26px rgba(42, 89, 143, 0.10)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
