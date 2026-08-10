import { computePauseWins, computePauseLevel } from "./pauseWins";
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

const NOW = new Date(2026, 6, 10); // Friday, July 10, 2026
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * DAY_MS).toISOString();
}

describe("computePauseWins", () => {
  it("returns all zeros for no decisions", () => {
    const wins = computePauseWins([], NOW);
    expect(wins.weekly).toEqual({ pauses: 0, skipped: 0, moneyKeptCents: 0, intentionalRate: 0 });
    expect(wins.lifetime).toEqual({ pauses: 0, skipped: 0, moneyKeptCents: 0, intentionalRate: 0 });
  });

  it("counts paused and reconsidered as pauses, only reconsidered as skipped", () => {
    const decisions = [
      makeDecision({ id: "d1", outcome: "paused", amountCents: 1000, decidedAt: daysAgo(1) }),
      makeDecision({ id: "d2", outcome: "reconsidered", amountCents: 2000, decidedAt: daysAgo(1) }),
      makeDecision({ id: "d3", outcome: "continued", amountCents: 3000, decidedAt: daysAgo(1) }),
    ];
    const wins = computePauseWins(decisions, NOW);
    expect(wins.lifetime.pauses).toBe(2);
    expect(wins.lifetime.skipped).toBe(1);
    expect(wins.lifetime.moneyKeptCents).toBe(3000); // 1000 + 2000, "continued" isn't kept
    expect(wins.lifetime.intentionalRate).toBe(67); // 2/3 rounded
  });

  it("scopes weekly to the trailing 7 days, lifetime to everything", () => {
    const decisions = [
      makeDecision({ id: "recent", outcome: "paused", amountCents: 1000, decidedAt: daysAgo(2) }),
      makeDecision({ id: "old", outcome: "paused", amountCents: 5000, decidedAt: daysAgo(30) }),
    ];
    const wins = computePauseWins(decisions, NOW);
    expect(wins.weekly.pauses).toBe(1);
    expect(wins.weekly.moneyKeptCents).toBe(1000);
    expect(wins.lifetime.pauses).toBe(2);
    expect(wins.lifetime.moneyKeptCents).toBe(6000);
  });
});

describe("computePauseLevel", () => {
  it("has no name before the first threshold", () => {
    expect(computePauseLevel(0)).toEqual({ name: null, pauses: 0, nextAt: 10, nextName: "The Starter" });
    expect(computePauseLevel(9)).toEqual({ name: null, pauses: 9, nextAt: 10, nextName: "The Starter" });
  });

  it("names the current level and the next threshold", () => {
    expect(computePauseLevel(10)).toEqual({ name: "The Starter", pauses: 10, nextAt: 25, nextName: "The Thinker" });
    expect(computePauseLevel(24)).toEqual({ name: "The Starter", pauses: 24, nextAt: 25, nextName: "The Thinker" });
    expect(computePauseLevel(25)).toEqual({
      name: "The Thinker",
      pauses: 25,
      nextAt: 50,
      nextName: "The Intentional Spender",
    });
    expect(computePauseLevel(50)).toEqual({
      name: "The Intentional Spender",
      pauses: 50,
      nextAt: 100,
      nextName: "The Money Protector",
    });
  });

  it("caps at the top level with no next threshold", () => {
    expect(computePauseLevel(100)).toEqual({ name: "The Money Protector", pauses: 100, nextAt: null, nextName: null });
    expect(computePauseLevel(500)).toEqual({ name: "The Money Protector", pauses: 500, nextAt: null, nextName: null });
  });
});
