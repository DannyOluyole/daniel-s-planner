export interface Temporal {
  createdAt: string;
  removedAt?: string;
}

function monthBounds(monthDate: Date): { start: Date; end: Date } {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Whether a commitment/income line genuinely existed at some point during
 * the given month — created on or before the month ends, and not removed
 * before the month starts. This is what keeps a bill added today from
 * silently rewriting what a past month's numbers were, and what keeps a
 * bill removed today from disappearing out of the months it was actually
 * active in.
 */
export function wasActiveDuringMonth(item: Temporal, monthDate: Date): boolean {
  const { start, end } = monthBounds(monthDate);
  const created = new Date(item.createdAt);
  if (created > end) return false;
  if (item.removedAt) {
    const removed = new Date(item.removedAt);
    if (removed < start) return false;
  }
  return true;
}

/** Sums amountCents for whichever items were active during the given month. */
export function sumActiveDuringMonth<T extends Temporal & { amountCents: number }>(
  items: T[],
  monthDate: Date
): number {
  return items.filter((i) => wasActiveDuringMonth(i, monthDate)).reduce((sum, i) => sum + i.amountCents, 0);
}
