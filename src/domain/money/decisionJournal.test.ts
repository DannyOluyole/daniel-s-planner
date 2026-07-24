import { sumMoneyProtected, mostCommonPauseReason } from "./decisionJournal";
import { SpendingDecision } from "@domain/entities/MoneyState";

function makeDecision(overrides: Partial<SpendingDecision>): SpendingDecision {
  return {
    id: "d1",
    amountCents: 1000,
    merchant: "Store",
    outcome: "continued",
    pauseDurationMs: 2000,
    decidedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("sumMoneyProtected", () => {
  it("sums only paused and reconsidered decisions", () => {
    const decisions = [
      makeDecision({ outcome: "continued", amountCents: 5000 }),
      makeDecision({ outcome: "paused", amountCents: 2000 }),
      makeDecision({ outcome: "reconsidered", amountCents: 1500 }),
    ];
    expect(sumMoneyProtected(decisions)).toBe(3500);
  });

  it("returns 0 when there's nothing to protect", () => {
    expect(sumMoneyProtected([makeDecision({ outcome: "continued" })])).toBe(0);
  });

  it("returns 0 for an empty list", () => {
    expect(sumMoneyProtected([])).toBe(0);
  });
});

describe("mostCommonPauseReason", () => {
  it("returns null when no decision has a reason", () => {
    const decisions = [makeDecision({ outcome: "paused" }), makeDecision({ outcome: "reconsidered" })];
    expect(mostCommonPauseReason(decisions)).toBeNull();
  });

  it("picks the reason used most often", () => {
    const decisions = [
      makeDecision({ outcome: "paused", pauseReason: "Too expensive." }),
      makeDecision({ outcome: "paused", pauseReason: "Too expensive." }),
      makeDecision({ outcome: "reconsidered", pauseReason: "Changed my mind." }),
    ];
    expect(mostCommonPauseReason(decisions)).toBe("Too expensive.");
  });

  it("ignores decisions without a reason when tallying", () => {
    const decisions = [
      makeDecision({ outcome: "paused", pauseReason: undefined }),
      makeDecision({ outcome: "paused", pauseReason: "Didn't really need it." }),
    ];
    expect(mostCommonPauseReason(decisions)).toBe("Didn't really need it.");
  });
});
