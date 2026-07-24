import { detectCategoryTrends } from "./insightsEngine";
import { SpendingDecision } from "@domain/entities/MoneyState";

const now = new Date("2026-07-22T12:00:00.000Z");

function decision(partial: Partial<SpendingDecision> & { id: string }): SpendingDecision {
  return {
    amountCents: 1000,
    merchant: "Somewhere",
    category: "Dining",
    outcome: "continued",
    pauseDurationMs: 2000,
    decidedAt: "2026-07-10T12:00:00.000Z",
    ...partial,
  };
}

describe("detectCategoryTrends", () => {
  it("returns nothing with no decisions", () => {
    expect(detectCategoryTrends([], now)).toEqual([]);
  });

  it("detects a category that increased beyond the threshold", () => {
    const decisions = [
      // Previous 30-day window (days 31-60 ago): $50 in Dining.
      decision({ id: "prev", decidedAt: "2026-06-10T12:00:00.000Z", amountCents: 5000 }),
      // Current 30-day window (last 30 days): $59 in Dining — +18%.
      decision({ id: "cur", decidedAt: "2026-07-10T12:00:00.000Z", amountCents: 5900 }),
    ];
    const trends = detectCategoryTrends(decisions, now);
    expect(trends).toEqual([
      { category: "Dining", currentCents: 5900, previousCents: 5000, percentChange: 18, direction: "up" },
    ]);
  });

  it("detects a category that decreased beyond the threshold", () => {
    const decisions = [
      decision({ id: "prev", decidedAt: "2026-06-10T12:00:00.000Z", amountCents: 10000 }),
      decision({ id: "cur", decidedAt: "2026-07-10T12:00:00.000Z", amountCents: 6000 }),
    ];
    const trends = detectCategoryTrends(decisions, now);
    expect(trends).toEqual([
      { category: "Dining", currentCents: 6000, previousCents: 10000, percentChange: -40, direction: "down" },
    ]);
  });

  it("ignores a swing below the minimum percent-change threshold", () => {
    const decisions = [
      decision({ id: "prev", decidedAt: "2026-06-10T12:00:00.000Z", amountCents: 10000 }),
      decision({ id: "cur", decidedAt: "2026-07-10T12:00:00.000Z", amountCents: 10500 }), // +5%
    ];
    expect(detectCategoryTrends(decisions, now)).toEqual([]);
  });

  it("ignores a category with too small a baseline to be meaningful", () => {
    const decisions = [
      decision({ id: "prev", decidedAt: "2026-06-10T12:00:00.000Z", amountCents: 300 }),
      decision({ id: "cur", decidedAt: "2026-07-10T12:00:00.000Z", amountCents: 900 }), // +200% but tiny baseline
    ];
    expect(detectCategoryTrends(decisions, now)).toEqual([]);
  });

  it("ignores paused and reconsidered decisions entirely, in either window", () => {
    const decisions = [
      decision({ id: "prev", decidedAt: "2026-06-10T12:00:00.000Z", amountCents: 10000, outcome: "reconsidered" }),
      decision({ id: "cur", decidedAt: "2026-07-10T12:00:00.000Z", amountCents: 6000, outcome: "paused" }),
    ];
    expect(detectCategoryTrends(decisions, now)).toEqual([]);
  });

  it("ignores decisions outside both 30-day windows", () => {
    const decisions = [
      decision({ id: "ancient", decidedAt: "2026-01-01T12:00:00.000Z", amountCents: 10000 }),
      decision({ id: "cur", decidedAt: "2026-07-10T12:00:00.000Z", amountCents: 6000 }),
    ];
    // No previous-window baseline for Dining, so no trend even though
    // there's plenty of history further back.
    expect(detectCategoryTrends(decisions, now)).toEqual([]);
  });

  it("sorts multiple trends by magnitude of change, largest first", () => {
    const decisions = [
      decision({ id: "p1", category: "Dining", decidedAt: "2026-06-10T12:00:00.000Z", amountCents: 10000 }),
      decision({ id: "c1", category: "Dining", decidedAt: "2026-07-10T12:00:00.000Z", amountCents: 12000 }), // +20%
      decision({ id: "p2", category: "Groceries", decidedAt: "2026-06-10T12:00:00.000Z", amountCents: 10000 }),
      decision({ id: "c2", category: "Groceries", decidedAt: "2026-07-10T12:00:00.000Z", amountCents: 15000 }), // +50%
    ];
    const trends = detectCategoryTrends(decisions, now);
    expect(trends.map((t) => t.category)).toEqual(["Groceries", "Dining"]);
  });
});
