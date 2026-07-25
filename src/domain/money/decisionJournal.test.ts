import { sumMoneyProtected, mostCommonPauseReason, findRelevantPauseReason } from "./decisionJournal";
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

describe("findRelevantPauseReason", () => {
  it("returns null when there's no history for this merchant or category", () => {
    const decisions = [makeDecision({ outcome: "paused", merchant: "Other Store", pauseReason: "Too expensive." })];
    expect(findRelevantPauseReason(decisions, "New Store", "Shopping")).toBeNull();
  });

  it("matches on merchant, case-insensitively", () => {
    const decisions = [
      makeDecision({ outcome: "reconsidered", merchant: "ZARA", category: "Shopping", pauseReason: "Changed my mind." }),
    ];
    const match = findRelevantPauseReason(decisions, "zara", "Shopping");
    expect(match).toEqual({ reason: "Changed my mind.", merchant: "ZARA", matchedOn: "merchant" });
  });

  it("falls back to category when no merchant matches", () => {
    const decisions = [
      makeDecision({ outcome: "paused", merchant: "Old Navy", category: "Shopping", pauseReason: "Too expensive." }),
    ];
    const match = findRelevantPauseReason(decisions, "Zara", "Shopping");
    expect(match).toEqual({ reason: "Too expensive.", merchant: "Old Navy", matchedOn: "category" });
  });

  it("prefers a merchant match over a category match", () => {
    const decisions = [
      makeDecision({ outcome: "paused", merchant: "Old Navy", category: "Shopping", pauseReason: "Too expensive." }),
      makeDecision({ outcome: "paused", merchant: "Zara", category: "Shopping", pauseReason: "Changed my mind." }),
    ];
    const match = findRelevantPauseReason(decisions, "Zara", "Shopping");
    expect(match?.matchedOn).toBe("merchant");
    expect(match?.reason).toBe("Changed my mind.");
  });

  it("ignores continued decisions and ones without a saved reason", () => {
    const decisions = [
      makeDecision({ outcome: "continued", merchant: "Zara", category: "Shopping" }),
      makeDecision({ outcome: "paused", merchant: "Zara", category: "Shopping", pauseReason: undefined }),
    ];
    expect(findRelevantPauseReason(decisions, "Zara", "Shopping")).toBeNull();
  });

  it("returns the first (most recent) match when several exist", () => {
    const decisions = [
      makeDecision({ outcome: "paused", merchant: "Zara", category: "Shopping", pauseReason: "Too expensive." }),
      makeDecision({ outcome: "reconsidered", merchant: "Zara", category: "Shopping", pauseReason: "Changed my mind." }),
    ];
    const match = findRelevantPauseReason(decisions, "Zara", "Shopping");
    expect(match?.reason).toBe("Too expensive.");
  });
});
