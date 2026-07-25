import { buildMonthlyReplay, buildMonthlyReplayLines } from "./monthlyReplay";
import { SpendingDecision } from "@domain/entities/MoneyState";

const JULY = new Date(2026, 6, 15);

function makeDecision(overrides: Partial<SpendingDecision>): SpendingDecision {
  return {
    id: "d1",
    amountCents: 1000,
    merchant: "Store",
    outcome: "continued",
    pauseDurationMs: 2000,
    decidedAt: "2026-07-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildMonthlyReplay", () => {
  it("counts decisions, splitting continued from paused/reconsidered, for the given month only", () => {
    const decisions = [
      makeDecision({ id: "1", outcome: "continued" }),
      makeDecision({ id: "2", outcome: "paused" }),
      makeDecision({ id: "3", outcome: "reconsidered" }),
      makeDecision({ id: "4", outcome: "continued", decidedAt: "2026-06-10T00:00:00.000Z" }), // different month
    ];
    const replay = buildMonthlyReplay(decisions, JULY);
    expect(replay.totalDecisions).toBe(3);
    expect(replay.continuedCount).toBe(1);
    expect(replay.pausedCount).toBe(2);
    expect(replay.monthLabel).toBe("July");
  });

  it("sums money protected from this month's paused/reconsidered decisions only", () => {
    const decisions = [
      makeDecision({ id: "1", outcome: "paused", amountCents: 5000 }),
      makeDecision({ id: "2", outcome: "reconsidered", amountCents: 3000 }),
      makeDecision({ id: "3", outcome: "paused", amountCents: 9000, decidedAt: "2026-06-10T00:00:00.000Z" }),
    ];
    expect(buildMonthlyReplay(decisions, JULY).moneyProtectedCents).toBe(8000);
  });

  it("finds the highest-spending intent among this month's continued purchases", () => {
    const decisions = [
      makeDecision({ id: "1", outcome: "continued", category: "Books", amountCents: 5000 }),
      makeDecision({ id: "2", outcome: "continued", category: "Dining", amountCents: 2000 }),
    ];
    const replay = buildMonthlyReplay(decisions, JULY);
    expect(replay.topIntent?.intent).toBe("Investing in myself");
  });

  it("returns zeroed-out fields for a month with no activity", () => {
    const replay = buildMonthlyReplay([], JULY);
    expect(replay.totalDecisions).toBe(0);
    expect(replay.continuedCount).toBe(0);
    expect(replay.pausedCount).toBe(0);
    expect(replay.moneyProtectedCents).toBe(0);
    expect(replay.topIntent).toBeNull();
  });
});

describe("buildMonthlyReplayLines", () => {
  it("returns an empty-month message when there's no activity", () => {
    const replay = buildMonthlyReplay([], JULY);
    const lines = buildMonthlyReplayLines(replay);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("No Checkpoints yet");
  });

  it("leads with the decision-count line, using correct singular/plural forms", () => {
    const decisions = [makeDecision({ id: "1", outcome: "continued" })];
    const lines = buildMonthlyReplayLines(buildMonthlyReplay(decisions, JULY));
    expect(lines[0]).toBe("You made 1 decision in July — 1 purchase, 0 paused.");
  });

  it("adds the money-protected line only when there was something to protect", () => {
    const decisions = [
      makeDecision({ id: "1", outcome: "continued" }),
      makeDecision({ id: "2", outcome: "paused", amountCents: 8420 }),
    ];
    const lines = buildMonthlyReplayLines(buildMonthlyReplay(decisions, JULY));
    expect(lines).toContain("Those 1 pause protected $84.20.");
  });

  it("omits the money-protected line when nothing was paused", () => {
    const decisions = [makeDecision({ id: "1", outcome: "continued" })];
    const lines = buildMonthlyReplayLines(buildMonthlyReplay(decisions, JULY));
    expect(lines.some((l) => l.includes("protected"))).toBe(false);
  });

  it("adds the top-intent line when there's continued spend to categorize", () => {
    const decisions = [makeDecision({ id: "1", outcome: "continued", category: "Books", amountCents: 5000 })];
    const lines = buildMonthlyReplayLines(buildMonthlyReplay(decisions, JULY));
    expect(lines.some((l) => l.includes("investing in myself"))).toBe(true);
  });
});
