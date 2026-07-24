import { computeFinancialConfidence } from "./financialConfidence";
import { SavingsGoal } from "@domain/entities/SavingsGoal";

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

describe("computeFinancialConfidence", () => {
  it("scores 100 with no goals and every check passing", () => {
    const result = computeFinancialConfidence(100000, [], false, false);
    expect(result.score).toBe(100);
    expect(result.checks).toEqual({ billsCovered: true, savingsOnTrack: true, spendingWithinBudget: true });
    expect(result.label).toBe("You're financially stable this month.");
  });

  it("passes savingsOnTrack when available is at or above every active goal's target", () => {
    const goals = [makeGoal({ targetCents: 50000 }), makeGoal({ id: "g2", targetCents: 30000 })];
    const result = computeFinancialConfidence(60000, goals, false, false);
    expect(result.checks.savingsOnTrack).toBe(true);
  });

  it("fails savingsOnTrack when available has dipped below any active goal's target", () => {
    const goals = [makeGoal({ targetCents: 50000 }), makeGoal({ id: "g2", targetCents: 30000 })];
    const result = computeFinancialConfidence(40000, goals, false, false);
    expect(result.checks.savingsOnTrack).toBe(false);
    expect(result.score).toBe(65); // 100 - 35
  });

  it("ignores removed goals when checking savingsOnTrack", () => {
    const goals = [makeGoal({ targetCents: 90000, removedAt: "2026-06-01T00:00:00.000Z" })];
    const result = computeFinancialConfidence(1000, goals, false, false);
    expect(result.checks.savingsOnTrack).toBe(true);
  });

  it("subtracts for each failing check independently", () => {
    const goals = [makeGoal({ targetCents: 90000 })];
    const result = computeFinancialConfidence(1000, goals, true, true);
    expect(result.checks).toEqual({ billsCovered: false, savingsOnTrack: false, spendingWithinBudget: false });
    expect(result.score).toBe(0); // 100 - 35 - 35 - 30
  });

  it("never goes below 0", () => {
    const goals = [makeGoal({ targetCents: 90000 }), makeGoal({ id: "g2", targetCents: 80000 })];
    const result = computeFinancialConfidence(-50000, goals, true, true);
    expect(result.score).toBe(0);
  });

  it("labels a mid-range score as a few things to watch", () => {
    // Only spendingWithinBudget fails: 100 - 30 = 70.
    const result = computeFinancialConfidence(100000, [], true, false);
    expect(result.score).toBe(70);
    expect(result.label).toBe("Mostly on track, a few things to watch.");
  });

  it("labels a low score as needing attention", () => {
    // billsCovered and savingsOnTrack both fail: 100 - 35 - 35 = 30.
    const result = computeFinancialConfidence(1000, [makeGoal({ targetCents: 90000 })], false, true);
    expect(result.score).toBe(30);
    expect(result.label).toBe("Multiple things need attention this month.");
  });
});
