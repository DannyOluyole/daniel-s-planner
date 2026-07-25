import { SpendingDecision } from "@domain/entities/MoneyState";

function escapeCsvField(value: string): string {
  // Only quote fields that actually need it — a comma, quote, or newline
  // inside the value would otherwise be misread as a column/row break.
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * The user's own decision history as a spreadsheet-friendly CSV — one row
 * per Checkpoint, dollars rather than cents since this is meant to be read
 * by a person, not re-parsed by the app itself.
 */
export function decisionsToCsv(decisions: SpendingDecision[]): string {
  const header = "Date,Merchant,Category,Outcome,Amount,Reason";
  const rows = decisions.map((d) =>
    [
      d.decidedAt.slice(0, 10),
      escapeCsvField(d.merchant),
      escapeCsvField(d.category ?? ""),
      d.outcome,
      (d.amountCents / 100).toFixed(2),
      escapeCsvField(d.pauseReason ?? ""),
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export function decisionsToJson(decisions: SpendingDecision[]): string {
  return JSON.stringify(decisions, null, 2);
}
