import { decisionsToCsv, decisionsToJson } from "./decisionExport";
import { SpendingDecision } from "@domain/entities/MoneyState";

function makeDecision(overrides: Partial<SpendingDecision>): SpendingDecision {
  return {
    id: "d1",
    amountCents: 1250,
    merchant: "Store",
    outcome: "continued",
    pauseDurationMs: 2000,
    decidedAt: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("decisionsToCsv", () => {
  it("writes a header row plus one row per decision", () => {
    const csv = decisionsToCsv([makeDecision({})]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Merchant,Category,Outcome,Amount,Reason");
    expect(lines).toHaveLength(2);
  });

  it("formats cents as a dollar amount", () => {
    const csv = decisionsToCsv([makeDecision({ amountCents: 12345 })]);
    expect(csv).toContain("123.45");
  });

  it("uses the date-only portion of decidedAt", () => {
    const csv = decisionsToCsv([makeDecision({ decidedAt: "2026-07-01T12:00:00.000Z" })]);
    expect(csv).toContain("2026-07-01");
    expect(csv).not.toContain("12:00:00");
  });

  it("leaves category and reason blank when absent", () => {
    const csv = decisionsToCsv([makeDecision({ category: undefined, pauseReason: undefined })]);
    const row = csv.split("\n")[1];
    expect(row).toBe("2026-07-01,Store,,continued,12.50,");
  });

  it("includes the pause reason when present", () => {
    const csv = decisionsToCsv([
      makeDecision({ outcome: "paused", pauseReason: "Too expensive." }),
    ]);
    expect(csv).toContain("Too expensive.");
  });

  it("quotes a merchant name containing a comma", () => {
    const csv = decisionsToCsv([makeDecision({ merchant: "Smith, Jones & Co" })]);
    expect(csv).toContain('"Smith, Jones & Co"');
  });

  it("escapes embedded quotes by doubling them", () => {
    const csv = decisionsToCsv([makeDecision({ pauseReason: 'Said "no" to myself' })]);
    expect(csv).toContain('"Said ""no"" to myself"');
  });

  it("returns just the header for an empty list", () => {
    expect(decisionsToCsv([])).toBe("Date,Merchant,Category,Outcome,Amount,Reason");
  });
});

describe("decisionsToJson", () => {
  it("round-trips the decisions array", () => {
    const decisions = [makeDecision({}), makeDecision({ id: "d2", outcome: "paused" })];
    const parsed = JSON.parse(decisionsToJson(decisions));
    expect(parsed).toEqual(decisions);
  });
});
