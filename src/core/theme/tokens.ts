/**
 * Checkpoint design tokens.
 * Single source of truth for anything not expressed via NativeWind classes
 * (e.g. values needed inside SVG, Reanimated, or gradients).
 * Keep in sync with tailwind.config.js.
 */

export const colors = {
  canvas: "#F7FAF8",
  canvasDark: "#0D1210",
  surface: "#FFFFFF",
  surfaceDark: "#161C1A",
  surfaceRaised: "#EFF6F1",
  surfaceRaisedDark: "#1B2621",
  ink: "#12211B",
  inkSoft: "#4A6B58",
  inkFaint: "#8FA99B",
  inkDark: "#EDF7F2",
  // Brand — a confident, saturated emerald used generously (bold & friendly),
  // not the old single-muted-accent restraint.
  checkpoint: "#12B76A",
  checkpointSoft: "#D6F5E4",
  checkpointBright: "#7FE6A8",
  caution: "#B8865B",
  pause: "#8A6FB0",
  safe: "#12B76A",
  hairline: "#E2EDE6",
  hairlineDark: "#1A211D",
  // The Decision Mode gate stripe.
  gate: "#E8A33D",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 12,
  md: 20,
  lg: 28,
  full: 999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: "600", letterSpacing: -0.6 },
  title: { fontSize: 22, fontWeight: "600", letterSpacing: -0.3 },
  headline: { fontSize: 17, fontWeight: "600", letterSpacing: -0.1 },
  body: { fontSize: 15, fontWeight: "400", letterSpacing: 0 },
  caption: { fontSize: 13, fontWeight: "500", letterSpacing: 0.1 },
  micro: { fontSize: 11, fontWeight: "500", letterSpacing: 0.2 },
} as const;

export const motion = {
  quick: 160,
  base: 260,
  deliberate: 420,
  pause: 900, // used by the Spending Wall's mandatory pause beat
  gateLift: 550, // the gate-raising beat on Continue, before navigating away
} as const;
