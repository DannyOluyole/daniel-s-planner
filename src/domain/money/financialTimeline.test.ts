import { buildFinancialTimeline, computeSafeSpendingDays } from "./financialTimeline";
import { Income } from "@domain/entities/Income";
import { Commitment } from "@domain/entities/Commitment";

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

// Fixed "now" so day-of-month math is deterministic across test runs.
const NOW = new Date(2026, 6, 10); // July 10, 2026

describe("buildFinancialTimeline", () => {
  it("projects a future income event and adds it to the running balance", () => {
    const income = [makeIncome({ dayOfMonth: 25, amountCents: 200000 })];
    const timeline = buildFinancialTimeline(50000, income, [], null, NOW, 45);

    expect(timeline.events).toHaveLength(1);
    expect(timeline.events[0]).toMatchObject({ date: "2026-07-25", amountCents: 200000, kind: "income" });
    expect(timeline.runningBalances[0]).toBe(250000);
  });

  it("orders events chronologically regardless of input order", () => {
    const income = [makeIncome({ dayOfMonth: 28, amountCents: 200000 })];
    const commitments = [makeCommitment({ dayOfMonth: 15, amountCents: 50000 })];
    // A 20-day horizon keeps this to one occurrence each — a longer window
    // would also pick up next month's recurrence of the day-15 commitment.
    const timeline = buildFinancialTimeline(100000, income, commitments, null, NOW, 20);

    expect(timeline.events.map((e) => e.date)).toEqual(["2026-07-15", "2026-07-28"]);
    expect(timeline.runningBalances).toEqual([50000, 250000]);
  });

  it("excludes variable commitments — they have no single due date", () => {
    const commitments = [
      makeCommitment({ type: "variable", category: "Dining", dayOfMonth: 15, amountCents: 30000 }),
    ];
    const timeline = buildFinancialTimeline(100000, [], commitments, null, NOW, 45);
    expect(timeline.events).toHaveLength(0);
  });

  it("excludes removed income/commitments", () => {
    const income = [makeIncome({ dayOfMonth: 25, removedAt: "2026-07-01T00:00:00.000Z" })];
    const timeline = buildFinancialTimeline(50000, income, [], null, NOW, 45);
    expect(timeline.events).toHaveLength(0);
  });

  it("defaults an unscheduled item to day 1 of the month", () => {
    const income = [makeIncome({ dayOfMonth: undefined, amountCents: 100000 })];
    const timeline = buildFinancialTimeline(0, income, [], null, NOW, 45);
    // Day 1 already passed this month relative to NOW (July 10), so it rolls to August 1.
    expect(timeline.events[0].date).toBe("2026-08-01");
  });

  it("clamps a day-of-month beyond the target month's length", () => {
    // September has 30 days — day 31 should land on the 30th, not overflow into October.
    const commitments = [makeCommitment({ dayOfMonth: 31, amountCents: 10000 })];
    const sept1 = new Date(2026, 8, 1);
    const timeline = buildFinancialTimeline(100000, [], commitments, null, sept1, 30);
    expect(timeline.events[0].date).toBe("2026-09-30");
  });

  it("includes a hypothetical purchase dated today and reflects it in the running balance", () => {
    const timeline = buildFinancialTimeline(50000, [], [], { name: "New shoes", amountCents: 12000 }, NOW, 45);
    expect(timeline.events[0]).toMatchObject({ date: "2026-07-10", amountCents: -12000, kind: "hypothetical" });
    expect(timeline.runningBalances[0]).toBe(38000);
  });

  it("flags a shortfall when the balance goes negative before the next income", () => {
    const income = [makeIncome({ dayOfMonth: 25, amountCents: 200000 })];
    const commitments = [makeCommitment({ dayOfMonth: 12, amountCents: 30000 })];
    const timeline = buildFinancialTimeline(20000, income, commitments, null, NOW, 45);

    // Rent (30000) due on the 12th before the paycheck on the 25th, starting from 20000.
    expect(timeline.causesShortfall).toBe(true);
    expect(timeline.lowestBalanceCents).toBe(-10000);
    expect(timeline.lowestBalanceDate).toBe("2026-07-12");
  });

  it("does not flag a shortfall when the dip happens after the next paycheck", () => {
    const income = [makeIncome({ dayOfMonth: 15, amountCents: 200000 })];
    const commitments = [makeCommitment({ dayOfMonth: 20, amountCents: 300000 })];
    // A 15-day horizon keeps this to one occurrence each within July.
    const timeline = buildFinancialTimeline(50000, income, commitments, null, NOW, 15);

    // Paycheck on the 15th brings balance to 250000, then rent on the 20th drops it to -50000 —
    // that's after the first income event, so it's a later-month problem, not an
    // immediate "can't make it to payday" one.
    expect(timeline.causesShortfall).toBe(false);
    expect(timeline.lowestBalanceCents).toBe(-50000);
  });

  it("has no shortfall when balance stays non-negative throughout", () => {
    const income = [makeIncome({ dayOfMonth: 25, amountCents: 200000 })];
    const timeline = buildFinancialTimeline(50000, income, [], null, NOW, 45);
    expect(timeline.causesShortfall).toBe(false);
  });

  it("projects biweekly income every 14 days from its anchor date", () => {
    const income = [
      makeIncome({ frequency: "biweekly", anchorDate: "2026-06-26", amountCents: 150000 }),
    ];
    // Anchor June 26 -> next occurrences: Jul 10, Jul 24 (both within a
    // 20-day horizon from NOW = Jul 10).
    const timeline = buildFinancialTimeline(50000, income, [], null, NOW, 20);
    expect(timeline.events.map((e) => e.date)).toEqual(["2026-07-10", "2026-07-24"]);
    expect(timeline.runningBalances).toEqual([200000, 350000]);
  });

  it("projects weekly income every 7 days from its anchor date", () => {
    const income = [makeIncome({ frequency: "weekly", anchorDate: "2026-07-03", amountCents: 50000 })];
    // Anchor Jul 3 -> Jul 10, Jul 17 within a 10-day horizon from NOW = Jul 10.
    const timeline = buildFinancialTimeline(0, income, [], null, NOW, 10);
    expect(timeline.events.map((e) => e.date)).toEqual(["2026-07-10", "2026-07-17"]);
  });

  it("includes a biweekly occurrence due today even when 'now' has a non-midnight time", () => {
    const afternoon = new Date(2026, 6, 10, 14, 32); // July 10, 2:32pm — today is the anchor day
    const income = [makeIncome({ frequency: "biweekly", anchorDate: "2026-07-10", amountCents: 150000 })];
    const timeline = buildFinancialTimeline(50000, income, [], null, afternoon, 5);
    expect(timeline.events[0]).toMatchObject({ date: "2026-07-10" });
  });

  it("falls back to monthly treatment when a biweekly/weekly item has no anchor date yet", () => {
    const income = [makeIncome({ frequency: "biweekly", anchorDate: undefined, dayOfMonth: 25 })];
    const timeline = buildFinancialTimeline(50000, income, [], null, NOW, 45);
    expect(timeline.events[0]).toMatchObject({ date: "2026-07-25" });
  });

  it("steps a biweekly anchor correctly across a DST transition", () => {
    // North America springs forward on Mar 8, 2026 (2am -> 3am) — a single
    // +14-day step from Feb 27 to Mar 13 straddles that transition. A naive
    // ms-based "+14 * 86400000" could land an hour off from local midnight
    // on the far side and silently shift the date by one.
    const beforeDst = new Date(2026, 1, 27); // Feb 27, 2026
    const income = [makeIncome({ frequency: "biweekly", anchorDate: "2026-02-27", amountCents: 100000 })];
    const timeline = buildFinancialTimeline(0, income, [], null, beforeDst, 20);
    expect(timeline.events.map((e) => e.date)).toEqual(["2026-02-27", "2026-03-13"]);
  });

  it("includes an occurrence due today even when 'now' has a non-midnight time", () => {
    // Regression test: comparing a midnight-normalized candidate date against
    // the exact current timestamp (rather than a date-only version of it)
    // made every real-world "now" — which is never exactly midnight — wrongly
    // conclude today's occurrence had "already passed," silently rolling
    // today's bill or paycheck to next month instead.
    const afternoon = new Date(2026, 6, 10, 14, 32); // July 10, 2:32pm — today is the 10th
    const income = [makeIncome({ dayOfMonth: 10, amountCents: 200000 })];
    const timeline = buildFinancialTimeline(50000, income, [], null, afternoon, 45);

    expect(timeline.events[0]).toMatchObject({ date: "2026-07-10", kind: "income" });
    expect(timeline.runningBalances[0]).toBe(250000);
  });
});

describe("computeSafeSpendingDays", () => {
  it("computes days until the next payday and an even daily allowance", () => {
    const income = [makeIncome({ dayOfMonth: 20, amountCents: 200000 })]; // NOW = Jul 10
    const timeline = buildFinancialTimeline(50000, income, [], null, NOW, 45);
    const result = computeSafeSpendingDays(50000, timeline, NOW);
    expect(result.daysUntilPayday).toBe(10);
    expect(result.dailyAllowanceCents).toBe(5000); // 50000 / 10
  });

  it("returns null for both fields when there's no scheduled income at all", () => {
    const timeline = buildFinancialTimeline(50000, [], [], null, NOW, 45);
    const result = computeSafeSpendingDays(50000, timeline, NOW);
    expect(result.daysUntilPayday).toBeNull();
    expect(result.dailyAllowanceCents).toBeNull();
  });

  it("returns null for the daily allowance when available is already at or below zero", () => {
    const income = [makeIncome({ dayOfMonth: 20, amountCents: 200000 })];
    const timeline = buildFinancialTimeline(-5000, income, [], null, NOW, 45);
    const result = computeSafeSpendingDays(-5000, timeline, NOW);
    expect(result.daysUntilPayday).toBe(10);
    expect(result.dailyAllowanceCents).toBeNull();
  });

  it("floors at least 1 day even if payday is today", () => {
    const income = [makeIncome({ dayOfMonth: 10, amountCents: 200000 })]; // NOW is also the 10th
    const timeline = buildFinancialTimeline(50000, income, [], null, NOW, 45);
    const result = computeSafeSpendingDays(50000, timeline, NOW);
    expect(result.daysUntilPayday).toBe(1);
  });
});
