import { summarizeCategoryImpact, sumContinuedThisMonth, summarizeIntentThisMonth } from "./categoryImpact";
import { Commitment } from "@domain/entities/Commitment";
import { SpendingDecision } from "@domain/entities/MoneyState";

const now = new Date("2026-07-18T12:00:00.000Z");

const commitments: Commitment[] = [
  {
    id: "c1",
    userId: "u1",
    name: "Groceries budget",
    type: "variable",
    category: "Groceries",
    amountCents: 15000,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "c2",
    userId: "u1",
    name: "Rent",
    type: "fixed",
    amountCents: 30000,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

const decisions: SpendingDecision[] = [
  {
    id: "d1",
    amountCents: 11800,
    merchant: "Groceries",
    category: "Groceries",
    outcome: "continued",
    pauseDurationMs: 2000,
    decidedAt: "2026-07-17T00:00:00.000Z",
  },
  {
    id: "d2",
    amountCents: 5000,
    merchant: "Groceries last month",
    category: "Groceries",
    outcome: "continued",
    pauseDurationMs: 2000,
    decidedAt: "2026-06-17T00:00:00.000Z",
  },
  {
    id: "d3",
    amountCents: 9999,
    merchant: "Reconsidered thing",
    category: "Groceries",
    outcome: "reconsidered",
    pauseDurationMs: 2000,
    decidedAt: "2026-07-17T00:00:00.000Z",
  },
  {
    id: "d4",
    amountCents: 3500,
    merchant: "Coffee run",
    category: "Dining",
    outcome: "continued",
    pauseDurationMs: 2000,
    decidedAt: "2026-07-10T00:00:00.000Z",
  },
  {
    id: "d5",
    amountCents: 6000,
    merchant: "Paused thing",
    category: "Shopping",
    outcome: "paused",
    pauseDurationMs: 2000,
    decidedAt: "2026-07-11T00:00:00.000Z",
  },
];

describe("summarizeCategoryImpact", () => {
  it("returns null when the purchase has no category", () => {
    expect(summarizeCategoryImpact(commitments, decisions, undefined, 1000, now)).toBeNull();
  });

  it("returns null when there's no variable budget for the category", () => {
    expect(summarizeCategoryImpact(commitments, decisions, "Entertainment", 1000, now)).toBeNull();
  });

  it("sums only this month's continued decisions in the matching category", () => {
    const result = summarizeCategoryImpact(commitments, decisions, "Groceries", 2000, now);
    expect(result?.spentBeforeCents).toBe(11800);
    expect(result?.spentAfterCents).toBe(13800);
  });

  it("is not over when the purchase keeps the category under budget", () => {
    const result = summarizeCategoryImpact(commitments, decisions, "Groceries", 2000, now);
    expect(result?.overBy).toBe(0);
  });

  it("reports how far over when the purchase exceeds the budget", () => {
    const result = summarizeCategoryImpact(commitments, decisions, "Groceries", 5000, now);
    // spent before 11800 + 5000 = 16800, budget 15000 -> over by 1800
    expect(result?.spentAfterCents).toBe(16800);
    expect(result?.overBy).toBe(1800);
  });

  it("matches category case-insensitively", () => {
    const result = summarizeCategoryImpact(commitments, decisions, "groceries", 1000, now);
    expect(result).not.toBeNull();
  });
});

describe("sumContinuedThisMonth", () => {
  it("sums continued decisions across all categories this month", () => {
    // d1 (11800, Groceries) + d4 (3500, Dining) — d2 is last month, d3 is
    // reconsidered, d5 is paused.
    expect(sumContinuedThisMonth(decisions, now)).toBe(15300);
  });

  it("excludes paused and reconsidered decisions", () => {
    const onlyNonContinued = decisions.filter((d) => d.outcome !== "continued");
    expect(sumContinuedThisMonth(onlyNonContinued, now)).toBe(0);
  });

  it("excludes decisions from other months", () => {
    const onlyLastMonth = decisions.filter((d) => d.id === "d2");
    expect(sumContinuedThisMonth(onlyLastMonth, now)).toBe(0);
  });
});

describe("summarizeIntentThisMonth", () => {
  it("groups this month's continued decisions by intent, excluding other months/outcomes", () => {
    // d1 (Groceries -> Responsibilities, 11800) and d4 (Dining -> Lifestyle,
    // 3500) qualify; d2 is last month, d3 is reconsidered, d5 is paused.
    const result = summarizeIntentThisMonth(decisions, now);
    expect(result).toEqual([
      { intent: "Responsibilities", spentCents: 11800 },
      { intent: "Lifestyle", spentCents: 3500 },
    ]);
  });

  it("sums a category into 'Investing in myself' correctly", () => {
    const invest: SpendingDecision[] = [
      {
        id: "books",
        amountCents: 4000,
        merchant: "Bookstore",
        category: "Books",
        outcome: "continued",
        pauseDurationMs: 1000,
        decidedAt: "2026-07-05T00:00:00.000Z",
      },
      {
        id: "gym",
        amountCents: 3000,
        merchant: "Gym membership",
        category: "Gym",
        outcome: "continued",
        pauseDurationMs: 1000,
        decidedAt: "2026-07-06T00:00:00.000Z",
      },
    ];
    const result = summarizeIntentThisMonth(invest, now);
    expect(result).toEqual([{ intent: "Investing in myself", spentCents: 7000 }]);
  });

  it("folds a missing category into 'Other' rather than dropping it", () => {
    const noCategory: SpendingDecision[] = [
      {
        id: "mystery",
        amountCents: 1000,
        merchant: "Unknown",
        category: undefined,
        outcome: "continued",
        pauseDurationMs: 1000,
        decidedAt: "2026-07-05T00:00:00.000Z",
      },
    ];
    expect(summarizeIntentThisMonth(noCategory, now)).toEqual([{ intent: "Other", spentCents: 1000 }]);
  });
});
