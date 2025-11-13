import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#FFFFFF",
          alternate: "#F2F2F2"
        },
        text: {
          DEFAULT: "#111111",
          muted: "#707070",
          light: "#FFFFFF"
        },
        brand: {
          primary: "#111111",
          secondary: "#E0E0E0",
          accent: "#C8B080"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        condensed: ["var(--font-archivo)", "system-ui", "sans-serif"]
      },
      letterSpacing: {
        tightest: "-0.04em",
        wider: "0.24em"
      },
      maxWidth: {
        content: "80rem"
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem"
      },
      boxShadow: {
        card: "0px 12px 24px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: []
};

export default config;

