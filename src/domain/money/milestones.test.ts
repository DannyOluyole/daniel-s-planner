import { detectFirstGoalReached, detectFirstProtectedDecision, detect30DaysOfUse } from "./milestones";
import { SavingsGoal } from "@domain/entities/SavingsGoal";
import { SpendingDecision } from "@domain/entities/MoneyState";

function makeGoal(overrides: Partial<SavingsGoal>): SavingsGoal {
  return {
    id: "goal-1",
    userId: "u1",
    name: "Trip",
    targetCents: 100000,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

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

const NOW = new Date(2026, 6, 10); // July 10, 2026
const DAY_MS = 24 * 60 * 60 * 1000;

describe("detectFirstGoalReached", () => {
  it("returns null when no goal's target is met", () => {
    const goals = [makeGoal({ targetCents: 100000 })];
    expect(detectFirstGoalReached(goals, 50000)).toBeNull();
  });

  it("returns the goal once available balance meets its target", () => {
    const goals = [makeGoal({ targetCents: 100000 })];
    expect(detectFirstGoalReached(goals, 100000)?.id).toBe("goal-1");
  });

  it("ignores removed goals", () => {
    const goals = [makeGoal({ targetCents: 100000, removedAt: "2026-02-01T00:00:00.000Z" })];
    expect(detectFirstGoalReached(goals, 200000)).toBeNull();
  });
});

describe("detectFirstProtectedDecision", () => {
  it("returns null when nothing was ever paused or reconsidered", () => {
    const decisions = [makeDecision({ outcome: "continued" })];
    expect(detectFirstProtectedDecision(decisions)).toBeNull();
  });

  it("returns the oldest paused/reconsidered decision regardless of input order", () => {
    const decisions = [
      makeDecision({ id: "newer", outcome: "paused", decidedAt: "2026-07-05T00:00:00.000Z" }),
      makeDecision({ id: "oldest", outcome: "reconsidered", decidedAt: "2026-06-01T00:00:00.000Z" }),
      makeDecision({ id: "continued", outcome: "continued", decidedAt: "2026-05-01T00:00:00.000Z" }),
    ];
    expect(detectFirstProtectedDecision(decisions)?.id).toBe("oldest");
  });
});

describe("detect30DaysOfUse", () => {
  it("returns false when the account is younger than 30 days", () => {
    const createdAt = new Date(NOW.getTime() - 10 * DAY_MS).toISOString();
    expect(detect30DaysOfUse(createdAt, NOW)).toBe(false);
  });

  it("returns true at exactly 30 days", () => {
    const createdAt = new Date(NOW.getTime() - 30 * DAY_MS).toISOString();
    expect(detect30DaysOfUse(createdAt, NOW)).toBe(true);
  });

  it("returns false when there's no created-at timestamp at all", () => {
    expect(detect30DaysOfUse(undefined, NOW)).toBe(false);
  });
});
