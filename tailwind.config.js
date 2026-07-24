/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Cool, slightly green-tinted canvas
        canvas: {
          DEFAULT: "#F7FAF8",
          dark: "#0D1210",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#161C1A",
          raised: "#EFF6F1",
          raisedDark: "#1B2621",
        },
        ink: {
          DEFAULT: "#12211B",
          soft: "#4A6B58",
          faint: "#8FA99B",
          dark: "#EDF7F2",
        },
        // Brand — a confident, saturated emerald used generously.
        checkpoint: {
          DEFAULT: "#12B76A",
          soft: "#D6F5E4",
          bright: "#7FE6A8",
        },
        signal: {
          caution: "#B8865B",
          pause: "#8A6FB0",
          safe: "#12B76A",
        },
        hairline: {
          DEFAULT: "#E2EDE6",
          dark: "#1A211D",
        },
        // The Decision Mode gate stripe.
        gate: "#E8A33D",
      },
      fontFamily: {
        display: ["System"],
        body: ["System"],
      },
      // Mirrors src/core/theme/tokens.ts's `typography` export — kept in
      // sync by hand since Tailwind config can't import TS at build time.
      fontSize: {
        display: ["34px", { letterSpacing: "-0.6px", fontWeight: "600" }],
        title: ["22px", { letterSpacing: "-0.3px", fontWeight: "600" }],
        headline: ["17px", { letterSpacing: "-0.1px", fontWeight: "600" }],
        body: ["15px", { letterSpacing: "0px", fontWeight: "400" }],
        caption: ["13px", { letterSpacing: "0.1px", fontWeight: "500" }],
        micro: ["11px", { letterSpacing: "0.2px", fontWeight: "500" }],
      },
      borderRadius: {
        xl2: "28px",
      },
    },
  },
  plugins: [],
};
