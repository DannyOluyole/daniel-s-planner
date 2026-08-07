import { computeWeeksProtectedStreak } from "./streak";
import { SpendingDecision } from "@domain/entities/MoneyState";

function makeDecision(overrides: Partial<SpendingDecision>): SpendingDecision {
  return {
    id: "dec-1",
    amountCents: 5000,
    merchant: "Some Store",
    outcome: "paused",
    pauseDurationMs: 5000,
    decidedAt: "2026-07-10T12:00:00.000Z",
    ...overrides,
  };
}

// Fixed "now" so week-boundary math is deterministic across test runs.
const NOW = new Date(2026, 6, 10); // Friday, July 10, 2026
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * DAY_MS).toISOString();
}

describe("computeWeeksProtectedStreak", () => {
  it("returns 0 for no decisions at all", () => {
    expect(computeWeeksProtectedStreak([], NOW)).toBe(0);
  });

  it("counts a single qualifying week as a streak of 1", () => {
    const decisions = [makeDecision({ outcome: "paused", decidedAt: daysAgo(1) })];
    expect(computeWeeksProtectedStreak(decisions, NOW)).toBe(1);
  });

  it("counts consecutive qualifying weeks", () => {
    const decisions = [
      makeDecision({ id: "d1", outcome: "paused", decidedAt: daysAgo(1) }), // this week
      makeDecision({ id: "d2", outcome: "reconsidered", decidedAt: daysAgo(8) }), // last week
      makeDecision({ id: "d3", outcome: "paused", decidedAt: daysAgo(15) }), // 2 weeks ago
    ];
    expect(computeWeeksProtectedStreak(decisions, NOW)).toBe(3);
  });

  it("stops at a week that had decisions but none paused/reconsidered", () => {
    const decisions = [
      makeDecision({ id: "d1", outcome: "paused", decidedAt: daysAgo(1) }), // this week: qualifies
      makeDecision({ id: "d2", outcome: "continued", decidedAt: daysAgo(8) }), // last week: breaks it
      makeDecision({ id: "d3", outcome: "paused", decidedAt: daysAgo(15) }), // never reached
    ];
    expect(computeWeeksProtectedStreak(decisions, NOW)).toBe(1);
  });

  it("skips over a week with zero decisions instead of breaking the streak", () => {
    const decisions = [
      makeDecision({ id: "d1", outcome: "paused", decidedAt: daysAgo(1) }), // this week
      // no decisions logged last week at all
      makeDecision({ id: "d2", outcome: "paused", decidedAt: daysAgo(15) }), // 2 weeks ago
    ];
    expect(computeWeeksProtectedStreak(decisions, NOW)).toBe(2);
  });

  it("does not reset to 0 just because the current in-progress week has no decisions yet", () => {
    const decisions = [
      makeDecision({ id: "d1", outcome: "paused", decidedAt: daysAgo(8) }), // last week only
    ];
    expect(computeWeeksProtectedStreak(decisions, NOW)).toBe(1);
  });

  it("a purely 'continued' history never starts a streak", () => {
    const decisions = [
      makeDecision({ id: "d1", outcome: "continued", decidedAt: daysAgo(1) }),
      makeDecision({ id: "d2", outcome: "continued", decidedAt: daysAgo(8) }),
    ];
    expect(computeWeeksProtectedStreak(decisions, NOW)).toBe(0);
  });
});
