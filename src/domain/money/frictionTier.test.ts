import { determineFrictionTier, FRICTION_PAUSE_MS } from "./frictionTier";

describe("determineFrictionTier", () => {
  it("is always normal when Big Purchase Mode is off, regardless of amount", () => {
    expect(determineFrictionTier(100000000, false, 20000)).toBe("normal");
  });

  it("is normal below the threshold", () => {
    expect(determineFrictionTier(1000, true, 20000)).toBe("normal");
  });

  it("is big at or above the threshold, below the reflection multiplier", () => {
    expect(determineFrictionTier(20000, true, 20000)).toBe("big");
    expect(determineFrictionTier(50000, true, 20000)).toBe("big");
  });

  it("is reflection at or above 5x the threshold, at standard intensity", () => {
    expect(determineFrictionTier(100000, true, 20000)).toBe("reflection");
    expect(determineFrictionTier(500000, true, 20000)).toBe("reflection");
  });

  it("defaults to standard intensity when none is passed", () => {
    expect(determineFrictionTier(100000, true, 20000)).toBe(determineFrictionTier(100000, true, 20000, "standard"));
  });

  it("floors the reflection base at the default $200 threshold — a low or zero threshold can't drag reflection down with it", () => {
    // A $1 "every purchase" threshold would put 5x that ($5) well under a
    // $2 coffee without the floor — the floor keeps reflection meaning
    // "genuinely large," regardless of how low the big-purchase threshold is.
    expect(determineFrictionTier(200, true, 1)).toBe("big"); // >= the $1 threshold
    expect(determineFrictionTier(50000, true, 1)).toBe("big"); // $500, still under the $1000 floor-based reflection line
    expect(determineFrictionTier(100000, true, 1)).toBe("reflection"); // $1000 = floor ($200) * standard multiplier (5)
  });

  it("escalates pause duration monotonically across tiers, at every intensity", () => {
    for (const intensity of ["gentle", "standard", "strong", "strict"] as const) {
      expect(FRICTION_PAUSE_MS[intensity].normal).toBeLessThan(FRICTION_PAUSE_MS[intensity].big);
      expect(FRICTION_PAUSE_MS[intensity].big).toBeLessThan(FRICTION_PAUSE_MS[intensity].reflection);
    }
  });

  it("escalates pause duration monotonically across intensities, for every tier", () => {
    const order = ["gentle", "standard", "strong", "strict"] as const;
    for (const tier of ["normal", "big", "reflection"] as const) {
      for (let i = 1; i < order.length; i++) {
        expect(FRICTION_PAUSE_MS[order[i - 1]][tier]).toBeLessThan(FRICTION_PAUSE_MS[order[i]][tier]);
      }
    }
  });

  it("standard intensity's durations are unchanged from before intensity existed", () => {
    expect(FRICTION_PAUSE_MS.standard).toEqual({ normal: 2200, big: 4500, reflection: 20000 });
  });

  it("a stricter intensity reaches reflection sooner than a gentler one, for the same threshold", () => {
    // At threshold=20000 (the floor itself), reflection base is the same
    // for every intensity — only the multiplier differs.
    const amount = 20000 * 3; // 3x threshold: strict (2x) and strong (3x) should already be reflection, gentle/standard not yet.
    expect(determineFrictionTier(amount, true, 20000, "strict")).toBe("reflection");
    expect(determineFrictionTier(amount, true, 20000, "strong")).toBe("reflection");
    expect(determineFrictionTier(amount, true, 20000, "standard")).toBe("big");
    expect(determineFrictionTier(amount, true, 20000, "gentle")).toBe("big");
  });
});
