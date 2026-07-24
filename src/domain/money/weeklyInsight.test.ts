import { topCategoryThisWeek } from "./weeklyInsight";
import { SpendingDecision } from "@domain/entities/MoneyState";

const now = new Date("2026-07-18T12:00:00.000Z");

function decision(partial: Partial<SpendingDecision> & { id: string }): SpendingDecision {
  return {
    amountCents: 1000,
    merchant: "Somewhere",
    category: "Dining",
    outcome: "continued",
    pauseDurationMs: 2000,
    decidedAt: "2026-07-16T12:00:00.000Z",
    ...partial,
  };
}

describe("topCategoryThisWeek", () => {
  it("returns null with no qualifying decisions", () => {
    expect(topCategoryThisWeek([], now)).toBeNull();
  });

  it("picks the category with the highest 7-day total, with count", () => {
    const result = topCategoryThisWeek(
      [
        decision({ id: "a", category: "Dining", amountCents: 2000 }),
        decision({ id: "b", category: "Dining", amountCents: 1500 }),
        decision({ id: "c", category: "Groceries", amountCents: 3000 }),
      ],
      now
    );
    expect(result).toEqual({ category: "Dining", spentCents: 3500, count: 2 });
  });

  it("ignores decisions older than 7 days", () => {
    const result = topCategoryThisWeek(
      [decision({ id: "old", decidedAt: "2026-07-01T12:00:00.000Z", amountCents: 99900 })],
      now
    );
    expect(result).toBeNull();
  });

  it("ignores paused and reconsidered decisions", () => {
    const result = topCategoryThisWeek(
      [
        decision({ id: "p", outcome: "paused", amountCents: 5000 }),
        decision({ id: "r", outcome: "reconsidered", amountCents: 5000 }),
      ],
      now
    );
    expect(result).toBeNull();
  });

  it("ignores decisions with no category", () => {
    const result = topCategoryThisWeek([decision({ id: "n", category: undefined })], now);
    expect(result).toBeNull();
  });
});
