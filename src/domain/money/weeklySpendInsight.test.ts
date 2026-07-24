import {
  topCategoryThisWeekFromTransactions,
  highestSpendingWeekday,
  detectCategoryTrendsFromTransactions,
} from "./weeklySpendInsight";
import { Transaction } from "@domain/entities/Transaction";

const now = new Date("2026-07-22T12:00:00.000Z");

function tx(partial: Partial<Transaction> & { id: string }): Transaction {
  return {
    merchantName: "Somewhere",
    amountCents: 1000,
    category: "Dining",
    pending: false,
    transactedAt: "2026-07-20",
    ...partial,
  };
}

describe("topCategoryThisWeekFromTransactions", () => {
  it("returns null with no qualifying transactions", () => {
    expect(topCategoryThisWeekFromTransactions([], now)).toBeNull();
  });

  it("picks the category with the highest 7-day total, with count", () => {
    const result = topCategoryThisWeekFromTransactions(
      [
        tx({ id: "a", category: "Dining", amountCents: 2000 }),
        tx({ id: "b", category: "Dining", amountCents: 1500 }),
        tx({ id: "c", category: "Groceries", amountCents: 3000 }),
      ],
      now
    );
    expect(result).toEqual({ category: "Dining", spentCents: 3500, count: 2 });
  });

  it("ignores transactions older than 7 days", () => {
    const result = topCategoryThisWeekFromTransactions(
      [tx({ id: "old", transactedAt: "2026-07-01", amountCents: 99900 })],
      now
    );
    expect(result).toBeNull();
  });

  it("ignores refunds/deposits (non-positive amounts) and transactions with no category", () => {
    const result = topCategoryThisWeekFromTransactions(
      [
        tx({ id: "refund", amountCents: -5000 }),
        tx({ id: "no-cat", category: undefined, amountCents: 5000 }),
      ],
      now
    );
    expect(result).toBeNull();
  });
});

describe("highestSpendingWeekday", () => {
  it("returns null with fewer than 5 real purchases", () => {
    const result = highestSpendingWeekday([
      tx({ id: "1", transactedAt: "2026-07-17" }),
      tx({ id: "2", transactedAt: "2026-07-18" }),
    ]);
    expect(result).toBeNull();
  });

  it("picks the weekday with the highest total spend", () => {
    // 2026-07-17 is a Friday.
    const transactions = [
      tx({ id: "1", transactedAt: "2026-07-17", amountCents: 5000 }),
      tx({ id: "2", transactedAt: "2026-07-17", amountCents: 5000 }),
      tx({ id: "3", transactedAt: "2026-07-18", amountCents: 1000 }),
      tx({ id: "4", transactedAt: "2026-07-19", amountCents: 1000 }),
      tx({ id: "5", transactedAt: "2026-07-20", amountCents: 1000 }),
    ];
    expect(highestSpendingWeekday(transactions)).toBe("Friday");
  });
});

describe("detectCategoryTrendsFromTransactions", () => {
  it("returns nothing with no transactions", () => {
    expect(detectCategoryTrendsFromTransactions([], now)).toEqual([]);
  });

  it("detects a category that increased beyond the threshold", () => {
    const transactions = [
      tx({ id: "prev", transactedAt: "2026-06-20", amountCents: 5000 }),
      tx({ id: "cur", transactedAt: "2026-07-20", amountCents: 5900 }), // +18%
    ];
    const trends = detectCategoryTrendsFromTransactions(transactions, now);
    expect(trends).toEqual([
      { category: "Dining", currentCents: 5900, previousCents: 5000, percentChange: 18, direction: "up" },
    ]);
  });

  it("ignores a swing below the minimum percent-change threshold", () => {
    const transactions = [
      tx({ id: "prev", transactedAt: "2026-06-20", amountCents: 10000 }),
      tx({ id: "cur", transactedAt: "2026-07-20", amountCents: 10500 }), // +5%
    ];
    expect(detectCategoryTrendsFromTransactions(transactions, now)).toEqual([]);
  });

  it("ignores refunds/deposits (non-positive amounts) in either window", () => {
    const transactions = [
      tx({ id: "prev", transactedAt: "2026-06-20", amountCents: -10000 }),
      tx({ id: "cur", transactedAt: "2026-07-20", amountCents: -6000 }),
    ];
    expect(detectCategoryTrendsFromTransactions(transactions, now)).toEqual([]);
  });

  it("sorts multiple trends by magnitude of change, largest first", () => {
    const transactions = [
      tx({ id: "p1", category: "Dining", transactedAt: "2026-06-20", amountCents: 10000 }),
      tx({ id: "c1", category: "Dining", transactedAt: "2026-07-20", amountCents: 12000 }), // +20%
      tx({ id: "p2", category: "Groceries", transactedAt: "2026-06-20", amountCents: 10000 }),
      tx({ id: "c2", category: "Groceries", transactedAt: "2026-07-20", amountCents: 15000 }), // +50%
    ];
    const trends = detectCategoryTrendsFromTransactions(transactions, now);
    expect(trends.map((t) => t.category)).toEqual(["Groceries", "Dining"]);
  });
});
