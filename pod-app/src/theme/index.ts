// Brand system from Documentation/Product Spec.md §1.2-1.4.
// Keep this the single source of truth for color/spacing/type — components
// should import from here rather than hardcoding hex values.

export const colors = {
  coral: "#FF5C5C", // primary — CTAs, streak flames, primary buttons
  teal: "#0FB5AE", // secondary — secondary actions, progress rings, group badges
  yellow: "#FFC93C", // accent — celebratory states, unlocks, confetti, badges
  ink: "#1B1B1F", // primary text, dark mode background
  cloud: "#F7F5F2", // light mode background (warm off-white, never pure white)
  mint: "#36D399", // success
  ember: "#FF7849", // alert — used sparingly, never shame-red
  white: "#FFFFFF",
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  display: {
    fontWeight: "800" as const,
  },
  body: {
    fontWeight: "400" as const,
  },
  medium: {
    fontWeight: "600" as const,
  },
};
