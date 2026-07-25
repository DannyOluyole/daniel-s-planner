import { buildDecisionNarrative } from "./decisionNarrative";
import { WallVerdict } from "./applyPurchase";
import { SavingsGoal } from "@domain/entities/SavingsGoal";
import { FinancialTimeline } from "./financialTimeline";

function makeGoal(overrides: Partial<SavingsGoal>): SavingsGoal {
  return {
    id: "goal-1",
    userId: "u1",
    name: "Cushion",
    targetCents: 50000,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const okVerdict: WallVerdict = { beforeCents: 41200, afterCents: 36700, dipsIntoGoalBy: 0, tone: "ok" };
const warnVerdict: WallVerdict = { beforeCents: 41200, afterCents: 16200, dipsIntoGoalBy: 13800, tone: "warn" };

describe("buildDecisionNarrative", () => {
  it("reads on-track with a high score when there's nothing to warn about", () => {
    const result = buildDecisionNarrative(okVerdict, 4500, null);
    expect(result.headline).toBe("Your future self can comfortably absorb this purchase.");
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.scoreLabel).toBe("Excellent decision");
  });

  it("names the goal and dollar amount when it dips in with no target date", () => {
    const goal = makeGoal({ name: "Trip", targetCents: 50000, targetDate: undefined });
    const result = buildDecisionNarrative(warnVerdict, 25000, goal);
    expect(result.headline).toBe("This purchase dips into Trip by $138.00.");
  });

  it("estimates a delay in days when the goal has a target date and pace", () => {
    const goal = makeGoal({
      name: "Trip",
      targetCents: 100000,
      targetDate: "2026-11-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    const result = buildDecisionNarrative(warnVerdict, 25000, goal);
    expect(result.headline).toContain("delays Trip by about");
  });

  it("prioritizes a real timeline shortfall over the goal-dip message", () => {
    const goal = makeGoal({ targetCents: 50000 });
    const timeline: FinancialTimeline = {
      events: [],
      runningBalances: [],
      lowestBalanceCents: -3565,
      lowestBalanceDate: "2026-07-23",
      causesShortfall: true,
    };
    const result = buildDecisionNarrative(warnVerdict, 25000, goal, timeline);
    expect(result.headline).toBe("This leaves you short by $35.65 before Jul 23.");
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("names an explicit wait-N-days figure when a baseline timeline is provided", () => {
    const timeline: FinancialTimeline = {
      events: [],
      runningBalances: [],
      lowestBalanceCents: -3565,
      lowestBalanceDate: "2026-07-23",
      causesShortfall: true,
    };
    // A baseline (no hypothetical purchase) whose only event — a paycheck —
    // lands 5 days after "now" and comfortably covers the purchase from
    // then on. computeDaysUntilSafeToSpend's own math is unit-tested in
    // financialTimeline.test.ts; this just confirms the headline picks up
    // whatever it returns, using an explicit "now" so the test is
    // deterministic rather than depending on the real wall-clock date.
    const now = new Date(2026, 6, 18); // Jul 18
    const baseline: FinancialTimeline = {
      events: [{ date: "2026-07-23", label: "Paycheck", amountCents: 200000, kind: "income" }],
      runningBalances: [200000],
      lowestBalanceCents: 0,
      lowestBalanceDate: null,
      causesShortfall: false,
    };
    const result = buildDecisionNarrative(warnVerdict, 25000, null, timeline, null, baseline, now);
    expect(result.headline).toBe(
      "Your future self would prefer you wait 5 days — this dips $35.65 into money you need by Jul 23."
    );
  });

  it("falls back to the dollar-shortfall headline when no baseline timeline is given", () => {
    const timeline: FinancialTimeline = {
      events: [],
      runningBalances: [],
      lowestBalanceCents: -3565,
      lowestBalanceDate: "2026-07-23",
      causesShortfall: true,
    };
    const result = buildDecisionNarrative(warnVerdict, 25000, null, timeline);
    expect(result.headline).toBe("This leaves you short by $35.65 before Jul 23.");
  });

  it("has no futureSelfNote when no vision was ever set", () => {
    const result = buildDecisionNarrative(okVerdict, 4500, null, null, null);
    expect(result.futureSelfNote).toBeNull();
  });

  it("reads encouragingly when on track and a vision exists", () => {
    const result = buildDecisionNarrative(okVerdict, 4500, null, null, "Buying my first house");
    expect(result.futureSelfNote).toBe("You're getting closer to buying my first house every week.");
  });

  it("reads reassuringly-but-honest when the purchase is a real concern", () => {
    const goal = makeGoal({ targetCents: 50000 });
    const result = buildDecisionNarrative(warnVerdict, 25000, goal, null, "Buying my first house");
    expect(result.futureSelfNote).toBe(
      "This won't stop buying my first house, but waiting until your next payday keeps you exactly on schedule."
    );
  });

  it("treats a real timeline shortfall as a concern for the future-self note too, even if verdict.tone is 'ok'", () => {
    const timeline: FinancialTimeline = {
      events: [],
      runningBalances: [],
      lowestBalanceCents: -1000,
      lowestBalanceDate: "2026-07-23",
      causesShortfall: true,
    };
    const result = buildDecisionNarrative(okVerdict, 4500, null, timeline, "Never worrying about bills");
    expect(result.futureSelfNote).toContain("This won't stop never worrying about bills");
  });

  it("only lowercases the first character of the vision, not the whole phrase", () => {
    const result = buildDecisionNarrative(okVerdict, 4500, null, null, "Buying My First House");
    expect(result.futureSelfNote).toBe("You're getting closer to buying My First House every week.");
  });
});
