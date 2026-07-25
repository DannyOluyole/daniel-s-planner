export type FrictionTier = "normal" | "big" | "reflection";

// A purchase at this many times the Big Purchase threshold gets the
// longest, most deliberate pause — proportional escalation off the
// threshold the user already set, rather than a second dollar figure to
// configure separately.
const REFLECTION_MULTIPLIER = 5;

export const FRICTION_PAUSE_MS: Record<FrictionTier, number> = {
  // The deliberate beat before "Continue" unlocks on an ordinary purchase —
  // long enough to interrupt autopilot, short enough not to feel punitive.
  normal: 2200,
  // Big Purchase Mode's existing pause — more questions worth actually
  // reading here, not just a longer wait for its own sake.
  big: 4500,
  // Reserved for the purchases furthest from routine — long enough that it
  // reads as a real invitation to sit with the decision, not a UI delay.
  reflection: 20000,
};

/**
 * How much friction (pause length before Continue unlocks) a purchase
 * deserves — scales with how much it actually matters, rather than the same
 * flat pause for a coffee and a laptop. Always "normal" when Big Purchase
 * Mode itself is off, since that toggle is the user's own call on whether
 * any of this extra friction applies at all.
 */
export function determineFrictionTier(
  amountCents: number,
  bigPurchaseModeEnabled: boolean,
  bigPurchaseThresholdCents: number
): FrictionTier {
  if (!bigPurchaseModeEnabled) return "normal";
  if (amountCents >= bigPurchaseThresholdCents * REFLECTION_MULTIPLIER) return "reflection";
  if (amountCents >= bigPurchaseThresholdCents) return "big";
  return "normal";
}
