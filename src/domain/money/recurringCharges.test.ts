import { detectRecurringCharges } from "./recurringCharges";
import { Transaction } from "@domain/entities/Transaction";

let nextId = 0;
function makeTx(overrides: Partial<Transaction>): Transaction {
  nextId += 1;
  return {
    id: `tx-${nextId}`,
    merchantName: "Store",
    amountCents: 1000,
    pending: false,
    transactedAt: "2026-01-15",
    ...overrides,
  };
}

describe("detectRecurringCharges", () => {
  it("returns nothing when a merchant has fewer than 3 distinct months", () => {
    const transactions = [
      makeTx({ merchantName: "Netflix", amountCents: 1549, transactedAt: "2026-05-01" }),
      makeTx({ merchantName: "Netflix", amountCents: 1549, transactedAt: "2026-06-01" }),
    ];
    expect(detectRecurringCharges(transactions)).toEqual([]);
  });

  it("detects a merchant charging a similar amount across 3+ distinct months", () => {
    const transactions = [
      makeTx({ merchantName: "Netflix", amountCents: 1549, transactedAt: "2026-04-01" }),
      makeTx({ merchantName: "Netflix", amountCents: 1549, transactedAt: "2026-05-01" }),
      makeTx({ merchantName: "Netflix", amountCents: 1549, transactedAt: "2026-06-01" }),
    ];
    const result = detectRecurringCharges(transactions);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      merchant: "Netflix",
      amountCents: 1549,
      occurrences: 3,
      lastChargedAt: "2026-06-01",
    });
  });

  it("ignores amounts that vary too much to be the same subscription", () => {
    const transactions = [
      makeTx({ merchantName: "Amazon", amountCents: 500, transactedAt: "2026-04-01" }),
      makeTx({ merchantName: "Amazon", amountCents: 4000, transactedAt: "2026-05-01" }),
      makeTx({ merchantName: "Amazon", amountCents: 1200, transactedAt: "2026-06-01" }),
    ];
    expect(detectRecurringCharges(transactions)).toEqual([]);
  });

  it("tolerates a small price change within the band", () => {
    const transactions = [
      makeTx({ merchantName: "Spotify", amountCents: 999, transactedAt: "2026-04-01" }),
      makeTx({ merchantName: "Spotify", amountCents: 999, transactedAt: "2026-05-01" }),
      makeTx({ merchantName: "Spotify", amountCents: 1079, transactedAt: "2026-06-01" }), // ~8% bump
    ];
    const result = detectRecurringCharges(transactions);
    expect(result).toHaveLength(1);
    expect(result[0].merchant).toBe("Spotify");
  });

  it("ignores refunds/deposits (non-positive amounts)", () => {
    const transactions = [
      makeTx({ merchantName: "Netflix", amountCents: 1549, transactedAt: "2026-04-01" }),
      makeTx({ merchantName: "Netflix", amountCents: 1549, transactedAt: "2026-05-01" }),
      makeTx({ merchantName: "Netflix", amountCents: -1549, transactedAt: "2026-05-15" }),
    ];
    expect(detectRecurringCharges(transactions)).toEqual([]);
  });

  it("matches merchant names case-insensitively but keeps original casing in the result", () => {
    const transactions = [
      makeTx({ merchantName: "NETFLIX.COM", amountCents: 1549, transactedAt: "2026-04-01" }),
      makeTx({ merchantName: "netflix.com", amountCents: 1549, transactedAt: "2026-05-01" }),
      makeTx({ merchantName: "Netflix.com", amountCents: 1549, transactedAt: "2026-06-01" }),
    ];
    const result = detectRecurringCharges(transactions);
    expect(result).toHaveLength(1);
    expect(result[0].merchant).toBe("Netflix.com");
  });

  it("sorts multiple recurring charges by occurrence count, most first", () => {
    const transactions = [
      makeTx({ merchantName: "Netflix", amountCents: 1549, transactedAt: "2026-01-01" }),
      makeTx({ merchantName: "Netflix", amountCents: 1549, transactedAt: "2026-02-01" }),
      makeTx({ merchantName: "Netflix", amountCents: 1549, transactedAt: "2026-03-01" }),
      makeTx({ merchantName: "Netflix", amountCents: 1549, transactedAt: "2026-04-01" }),
      makeTx({ merchantName: "Spotify", amountCents: 999, transactedAt: "2026-04-01" }),
      makeTx({ merchantName: "Spotify", amountCents: 999, transactedAt: "2026-05-01" }),
      makeTx({ merchantName: "Spotify", amountCents: 999, transactedAt: "2026-06-01" }),
    ];
    const result = detectRecurringCharges(transactions);
    expect(result.map((r) => r.merchant)).toEqual(["Netflix", "Spotify"]);
  });
});
