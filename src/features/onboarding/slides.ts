export interface OnboardingSlide {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
}

/**
 * The four ideas a new user needs before their first Checkpoint. Order
 * matters: state (Available/Protected) before the mechanism (Checkpoint)
 * before the payoff (Future You).
 */
export const onboardingSlides: OnboardingSlide[] = [
  {
    key: "welcome",
    eyebrow: "Checkpoint",
    title: "Tell us about your life, not your spreadsheet",
    body: "Not a budget. Not a scoreboard. We're less interested in your numbers than in what you're actually working toward.",
  },
  {
    key: "available",
    eyebrow: "Responsibilities & habits",
    title: "One number you can trust",
    body: "Once we know what's already spoken for — rent, the things you're saving for, the habits you already have — the rest is genuinely yours to spend today.",
  },
  {
    key: "checkpoint",
    eyebrow: "The Checkpoint",
    title: "A pause before it's final",
    body: "Before a purchase completes, Checkpoint shows you the honest impact and gives you a short, unhurried moment to decide.",
  },
  {
    key: "future-you",
    eyebrow: "Future You",
    title: "Every decision has a second owner",
    body: "Future You is who inherits today's choices — the dreams and plans you're actually building toward. Checkpoint keeps them in view, not to guilt you, just to remind you they're there.",
  },
];
