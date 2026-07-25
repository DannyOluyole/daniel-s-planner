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

  it("is reflection at or above 5x the threshold", () => {
    expect(determineFrictionTier(100000, true, 20000)).toBe("reflection");
    expect(determineFrictionTier(500000, true, 20000)).toBe("reflection");
  });

  it("escalates pause duration monotonically across tiers", () => {
    expect(FRICTION_PAUSE_MS.normal).toBeLessThan(FRICTION_PAUSE_MS.big);
    expect(FRICTION_PAUSE_MS.big).toBeLessThan(FRICTION_PAUSE_MS.reflection);
  });
});
