import { SpendingDecision } from "@domain/entities/MoneyState";

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

function weekKey(date: Date): string {
  return startOfWeek(date).toISOString().slice(0, 10);
}

/**
 * Consecutive weeks (most recent first) in which the user practiced the
 * pause — at least one logged decision with outcome "paused" or
 * "reconsidered." A week with zero decisions at all is skipped rather than
 * breaking the streak (no shopping temptation that week isn't a lapse); a
 * week with decisions but none paused/reconsidered ends the streak. The
 * in-progress current week only counts once it has a qualifying decision,
 * so the streak doesn't visually reset to 0 the moment Monday starts.
 */
export function computeWeeksProtectedStreak(decisions: SpendingDecision[], now: Date = new Date()): number {
  if (decisions.length === 0) return 0;

  const byWeek = new Map<string, SpendingDecision[]>();
  let earliestWeekStart = startOfWeek(now);
  for (const d of decisions) {
    const decidedAt = new Date(d.decidedAt);
    const key = weekKey(decidedAt);
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(d);
    const weekStart = startOfWeek(decidedAt);
    if (weekStart < earliestWeekStart) earliestWeekStart = weekStart;
  }

  let streak = 0;
  let cursor = startOfWeek(now);
  while (cursor >= earliestWeekStart) {
    const weekDecisions = byWeek.get(weekKey(cursor));
    if (weekDecisions && weekDecisions.length > 0) {
      const protectedThisWeek = weekDecisions.some((d) => d.outcome === "paused" || d.outcome === "reconsidered");
      if (protectedThisWeek) {
        streak += 1;
      } else {
        break;
      }
    }
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}
