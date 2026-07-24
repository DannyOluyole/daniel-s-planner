import { applyPurchase, computeWallVerdict, selectDippedGoal } from "./applyPurchase";
import { MoneyState } from "@domain/entities/MoneyState";
import { SavingsGoal } from "@domain/entities/SavingsGoal";

const baseState: MoneyState = {
  availableCents: 41200,
  protectedCents: 58800,
  futureYouCents: 15000,
  asOf: "2026-07-01T00:00:00.000Z",
};

describe("applyPurchase", () => {
  it("debits the purchase amount from availableCents", () => {
    const next = applyPurchase(baseState, 4500);
    expect(next.availableCents).toBe(36700);
  });

  it("leaves protectedCents and futureYouCents untouched", () => {
    const next = applyPurchase(baseState, 4500);
    expect(next.protectedCents).toBe(baseState.protectedCents);
    expect(next.futureYouCents).toBe(baseState.futureYouCents);
  });

  it("stamps a fresh asOf timestamp", () => {
    const next = applyPurchase(baseState, 4500);
    expect(next.asOf).not.toBe(baseState.asOf);
  });
});

describe("computeWallVerdict", () => {
  it("is 'ok' when the purchase leaves Available above the savings goal", () => {
    const verdict = computeWallVerdict(baseState, 4500, 15000);
    expect(verdict.tone).toBe("ok");
    expect(verdict.afterCents).toBe(36700);
    expect(verdict.dipsIntoGoalBy).toBe(0);
  });

  it("is 'warn' and reports the dip when Available after the purchase falls below the goal", () => {
    const verdict = computeWallVerdict(baseState, 40000, 15000);
    expect(verdict.tone).toBe("warn");
    expect(verdict.afterCents).toBe(1200);
    expect(verdict.dipsIntoGoalBy).toBe(13800);
  });

  it("is 'ok' when there is no savings goal set", () => {
    const verdict = computeWallVerdict(baseState, 100000, null);
    expect(verdict.tone).toBe("ok");
    expect(verdict.dipsIntoGoalBy).toBe(0);
  });

  it("treats exactly hitting the goal as 'ok' (only dipping below warns)", () => {
    const verdict = computeWallVerdict({ ...baseState, availableCents: 19500 }, 4500, 15000);
    expect(verdict.afterCents).toBe(15000);
    expect(verdict.tone).toBe("ok");
  });
});

function makeGoal(overrides: Partial<SavingsGoal>): SavingsGoal {
  return {
    id: "goal-1",
    userId: "u1",
    name: "Cushion",
    targetCents: 15000,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("selectDippedGoal", () => {
  it("returns null when no goal's target is above the post-purchase balance", () => {
    const goals = [makeGoal({ targetCents: 10000 })];
    expect(selectDippedGoal(goals, 20000)).toBeNull();
  });

  it("returns the single goal whose target the purchase dips into", () => {
    const goals = [makeGoal({ id: "g1", targetCents: 15000 })];
    expect(selectDippedGoal(goals, 5000)?.id).toBe("g1");
  });

  it("picks the goal with the nearest (lowest) target among several that are dipped into", () => {
    const goals = [
      makeGoal({ id: "cushion", name: "Cushion", targetCents: 50000 }),
      makeGoal({ id: "trip", name: "Trip to Japan", targetCents: 25000 }),
    ];
    // afterCents of 20000 dips into both — the trip goal (25000) is the
    // nearer threshold a shrinking balance crosses first.
    expect(selectDippedGoal(goals, 20000)?.id).toBe("trip");
  });

  it("ignores removed goals", () => {
    const goals = [makeGoal({ id: "gone", targetCents: 15000, removedAt: "2026-06-01T00:00:00.000Z" })];
    expect(selectDippedGoal(goals, 5000)).toBeNull();
  });
});
