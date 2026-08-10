export type FrictionTier = "normal" | "big" | "reflection";

export type PauseIntensity = "gentle" | "standard" | "strong" | "strict";

// How many times the big-purchase threshold a purchase needs to be before
// it earns the longest, most deliberate pause — scales with intensity so
// "Strict" escalates to reflection-tier friction sooner than "Gentle" does.
const REFLECTION_MULTIPLIER_BY_INTENSITY: Record<PauseIntensity, number> = {
  gentle: 8,
  standard: 5,
  strong: 3,
  strict: 2,
};

// The threshold picker (onboarding's Pause Rule step, Big Purchase Mode's
// own default) allows thresholds well under this — down to "every
// purchase," effectively $0. Without a floor, the reflection-tier check
// below (threshold * multiplier) would trigger on nearly everything for
// anyone who set a low threshold, turning a $2 coffee into a 20+ second
// reflection pause. Flooring the reflection base here keeps "low
// threshold" meaning "more purchases get *some* friction" without also
// meaning "ordinary purchases get the *longest* friction."
const DEFAULT_BIG_PURCHASE_FLOOR_CENTS = 20000;

export const FRICTION_PAUSE_MS: Record<PauseIntensity, Record<FrictionTier, number>> = {
  gentle: {
    normal: 1200,
    big: 3000,
    reflection: 12000,
  },
  // Unchanged from before intensity existed — the default, so nobody who
  // never touches the new Settings picker sees any behavior change.
  standard: {
    normal: 2200,
    big: 4500,
    reflection: 20000,
  },
  strong: {
    normal: 3500,
    big: 7000,
    reflection: 35000,
  },
  // The longest pause this app can enforce today — not a literal 24-hour
  // lock. A real lock needs a persisted "pending decision" state and a
  // resume flow, a materially bigger change than this settings knob;
  // deferred, and Settings' copy for this option says so explicitly.
  strict: {
    normal: 6000,
    big: 12000,
    reflection: 60000,
  },
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
  bigPurchaseThresholdCents: number,
  intensity: PauseIntensity = "standard"
): FrictionTier {
  if (!bigPurchaseModeEnabled) return "normal";
  const reflectionBaseCents = Math.max(bigPurchaseThresholdCents, DEFAULT_BIG_PURCHASE_FLOOR_CENTS);
  if (amountCents >= reflectionBaseCents * REFLECTION_MULTIPLIER_BY_INTENSITY[intensity]) return "reflection";
  if (amountCents >= bigPurchaseThresholdCents) return "big";
  return "normal";
}
