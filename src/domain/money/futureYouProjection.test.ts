import { computeFutureYouProjection } from "./futureYouProjection";
import { MoneyState } from "@domain/entities/MoneyState";

function makeState(overrides: Partial<MoneyState>): MoneyState {
  return {
    availableCents: 0,
    protectedCents: 0,
    futureYouCents: 0,
    asOf: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeFutureYouProjection", () => {
  it("returns null with fewer than two snapshots", () => {
    expect(computeFutureYouProjection([])).toBeNull();
    expect(computeFutureYouProjection([makeState({})])).toBeNull();
  });

  it("returns null when the snapshots are too close together to mean anything", () => {
    const history = [
      makeState({ futureYouCents: 10000, asOf: "2026-01-01T00:00:00.000Z" }),
      makeState({ futureYouCents: 10500, asOf: "2026-01-02T00:00:00.000Z" }), // 1 day apart
    ];
    expect(computeFutureYouProjection(history)).toBeNull();
  });

  it("projects a real monthly trend forward from the earliest and latest snapshot", () => {
    const history = [
      makeState({ futureYouCents: 10000, asOf: "2026-01-01T00:00:00.000Z" }),
      makeState({ futureYouCents: 13000, asOf: "2026-02-01T00:00:00.000Z" }), // 31 days later, +3000
    ];
    const result = computeFutureYouProjection(history, 12);
    // spanMonths = 31/30 ≈ 1.0333; monthlyTrend = round(3000 / 1.0333) = 2903
    expect(result?.monthlyTrendCents).toBe(2903);
    expect(result?.projectedCents).toBe(13000 + 2903 * 12);
  });

  it("uses the earliest and latest snapshot even when the list isn't sorted", () => {
    const history = [
      makeState({ futureYouCents: 20000, asOf: "2026-03-01T00:00:00.000Z" }),
      makeState({ futureYouCents: 10000, asOf: "2026-01-01T00:00:00.000Z" }),
      makeState({ futureYouCents: 15000, asOf: "2026-02-01T00:00:00.000Z" }),
    ];
    const result = computeFutureYouProjection(history, 1);
    // Should use Jan 1 (10000) as oldest and Mar 1 (20000) as newest, ignoring the middle snapshot.
    expect(result?.monthlyTrendCents).toBeGreaterThan(0);
    const spanMonths = 59 / 30; // Jan 1 to Mar 1 is 59 days
    const expectedTrend = Math.round(10000 / spanMonths);
    expect(result?.monthlyTrendCents).toBe(expectedTrend);
  });

  it("reflects a real declining trend honestly, without clamping to zero", () => {
    const history = [
      makeState({ futureYouCents: 10000, asOf: "2026-01-01T00:00:00.000Z" }),
      makeState({ futureYouCents: 4000, asOf: "2026-02-01T00:00:00.000Z" }),
    ];
    const result = computeFutureYouProjection(history, 12);
    expect(result?.monthlyTrendCents).toBeLessThan(0);
  });
});
