import { buildWhatIfOutcome } from "./whatIf";
import { Income } from "@domain/entities/Income";
import { Commitment } from "@domain/entities/Commitment";

const NOW = new Date(2026, 6, 10); // July 10, 2026

function makeIncome(overrides: Partial<Income>): Income {
  return {
    id: "inc-1",
    userId: "u1",
    name: "Paycheck",
    amountCents: 200000,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeCommitment(overrides: Partial<Commitment>): Commitment {
  return {
    id: "com-1",
    userId: "u1",
    name: "Rent",
    type: "fixed",
    amountCents: 150000,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildWhatIfOutcome", () => {
  it("returns a no-change headline when the delta is zero", () => {
    const outcome = buildWhatIfOutcome(0, 50000, [], [], NOW, 45);
    expect(outcome.headline).toBe("Nothing changes if you keep things exactly as they are.");
  });

  it("describes a positive delta (saving more) as extra daily allowance", () => {
    const income = [makeIncome({ dayOfMonth: 20, amountCents: 200000 })];
    const outcome = buildWhatIfOutcome(20000, 50000, income, [], NOW, 45);
    expect(outcome.headline).toContain("saved $200.00 more a month");
    expect(outcome.scenarioDailyAllowanceCents).not.toBeNull();
  });

  it("describes a negative delta (spending more) that still avoids a shortfall", () => {
    const income = [makeIncome({ dayOfMonth: 20, amountCents: 200000 })];
    const outcome = buildWhatIfOutcome(-5000, 50000, income, [], NOW, 45);
    expect(outcome.headline).toContain("spent $50.00 more a month");
    expect(outcome.scenarioCausesShortfall).toBe(false);
  });

  it("flags a shortfall the extra spending would actually cause", () => {
    const income = [makeIncome({ dayOfMonth: 20, amountCents: 200000 })];
    // Only $100 available, and spending $200 more before payday tips it negative.
    const outcome = buildWhatIfOutcome(-20000, 10000, income, [], NOW, 45);
    expect(outcome.scenarioCausesShortfall).toBe(true);
    expect(outcome.headline).toContain("run short");
  });

  it("keeps the user's real income/commitments in the simulation, not just the delta", () => {
    const income = [makeIncome({ dayOfMonth: 20, amountCents: 200000 })];
    const commitments = [makeCommitment({ dayOfMonth: 12, amountCents: 15000 })];
    // Available covers the rent bill on its own; adding $50 more spending
    // before then would tip it negative, proving the real commitment is
    // still part of the simulated timeline.
    const outcome = buildWhatIfOutcome(-5000, 15000, income, commitments, NOW, 45);
    expect(outcome.scenarioCausesShortfall).toBe(true);
  });
});
