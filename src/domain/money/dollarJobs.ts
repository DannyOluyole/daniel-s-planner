import { Commitment } from "@domain/entities/Commitment";

export interface DollarJobSegment {
  name: string;
  amountCents: number;
}

/**
 * Breaks this month's protected commitments into named segments (Rent,
 * Phone bill, ...) plus a trailing "Free" segment for whatever's left in
 * Available — the visual version of "every dollar has a job." Only fixed
 * and debt commitments are included, matching how Protected itself is
 * computed elsewhere — variable budgets have no single monthly amount to
 * segment, and savings goals are deliberately excluded: they're aspirational
 * targets, not a portion of this cycle's income already spoken for, so
 * counting them here would double up against what Available already means.
 */
export function buildDollarJobSegments(
  commitments: Commitment[],
  availableCents: number
): DollarJobSegment[] {
  const segments: DollarJobSegment[] = commitments
    .filter((c) => !c.removedAt && c.type !== "variable" && c.amountCents > 0)
    .map((c) => ({ name: c.name, amountCents: c.amountCents }));

  if (availableCents > 0) {
    segments.push({ name: "Free", amountCents: availableCents });
  }

  return segments;
}
