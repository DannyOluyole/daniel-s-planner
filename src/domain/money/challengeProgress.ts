import { Challenge } from "@domain/entities/Challenge";
import { SpendingDecision } from "@domain/entities/MoneyState";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ChallengeProgress {
  daysElapsed: number;
  daysTotal: number;
  /** A "continued" decision landed inside the challenge window — v1's only
   * challenge type (no_spend_week) fails the moment that happens, it
   * doesn't wait for the window to close. */
  failed: boolean;
  /** True once the window has fully elapsed without failing. */
  completed: boolean;
}

/**
 * Derived live from decisions, the same way the Weeks Protected streak is —
 * the challenges table only records that one was started, never a stored
 * pass/fail outcome.
 */
export function computeChallengeProgress(
  challenge: Challenge,
  decisions: SpendingDecision[],
  now: Date = new Date()
): ChallengeProgress {
  const start = new Date(challenge.startsAt);
  const end = new Date(challenge.endsAt);
  const daysTotal = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS));
  const clampedNow = now < start ? start : now > end ? end : now;
  const daysElapsed = Math.round((clampedNow.getTime() - start.getTime()) / DAY_MS);

  const failed = decisions.some((d) => {
    if (d.outcome !== "continued") return false;
    const decidedAt = new Date(d.decidedAt).getTime();
    return decidedAt >= start.getTime() && decidedAt <= end.getTime();
  });

  const completed = !failed && now.getTime() >= end.getTime();

  return { daysElapsed, daysTotal, failed, completed };
}

/**
 * Today, extended `days` forward — the shape a "Start a No-Spend Week"
 * button needs to build a ChallengeInput without callers doing date math.
 */
export function buildChallengeWindow(days: number, now: Date = new Date()): { startsAt: string; endsAt: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + days * DAY_MS);
  const toDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { startsAt: toDateKey(start), endsAt: toDateKey(end) };
}
