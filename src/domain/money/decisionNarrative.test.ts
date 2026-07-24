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
    expect(result.headline).toBe("This purchase keeps you on track.");
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
