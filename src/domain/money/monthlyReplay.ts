import { money, SpendingDecision } from "@domain/entities/MoneyState";
import { sumMoneyProtected } from "./decisionJournal";
import { summarizeIntentThisMonth, IntentSpend } from "./categoryImpact";

export interface MonthlyReplay {
  monthLabel: string;
  totalDecisions: number;
  continuedCount: number;
  /** Paused + reconsidered combined — both are "you stepped back," just at
   * different points in the pause. */
  pausedCount: number;
  moneyProtectedCents: number;
  topIntent: IntentSpend | null;
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * A month's worth of decision activity, retold as a short story instead
 * of a chart — "Financial Replay." Built only from real, already-tracked
 * numbers (decision counts, money protected, where continued spend went by
 * intent) — deliberately never invents a claim (like "you protected your
 * Vacation goal") that isn't actually reconstructable from stored history,
 * since past decisions don't record which goal, if any, they dipped into.
 */
export function buildMonthlyReplay(decisions: SpendingDecision[], monthDate: Date = new Date()): MonthlyReplay {
  const thisMonth = decisions.filter((d) => isSameMonth(new Date(d.decidedAt), monthDate));
  const continuedCount = thisMonth.filter((d) => d.outcome === "continued").length;
  const pausedCount = thisMonth.filter((d) => d.outcome === "paused" || d.outcome === "reconsidered").length;
  const moneyProtectedCents = sumMoneyProtected(thisMonth);
  const topIntent =
    summarizeIntentThisMonth(thisMonth, monthDate).sort((a, b) => b.spentCents - a.spentCents)[0] ?? null;

  return {
    monthLabel: monthDate.toLocaleDateString("en-US", { month: "long" }),
    totalDecisions: thisMonth.length,
    continuedCount,
    pausedCount,
    moneyProtectedCents,
    topIntent,
  };
}

/**
 * Turns the replay's numbers into short narrative lines, in reading order —
 * the whole point of Financial Replay is prose, not a dashboard, so callers
 * render this as a list of lines rather than a table of stats.
 */
export function buildMonthlyReplayLines(replay: MonthlyReplay): string[] {
  if (replay.totalDecisions === 0) {
    return [`No decisions yet this ${replay.monthLabel} — they'll show up here once you start.`];
  }

  const lines: string[] = [
    `You made ${replay.totalDecisions} ${
      replay.totalDecisions === 1 ? "decision" : "decisions"
    } in ${replay.monthLabel} — ${replay.continuedCount} ${
      replay.continuedCount === 1 ? "purchase" : "purchases"
    }, ${replay.pausedCount} paused.`,
  ];

  if (replay.pausedCount > 0 && replay.moneyProtectedCents > 0) {
    lines.push(
      `Those ${replay.pausedCount} ${replay.pausedCount === 1 ? "pause" : "pauses"} protected ${money(
        replay.moneyProtectedCents
      )}.`
    );
  }

  if (replay.topIntent && replay.topIntent.spentCents > 0) {
    lines.push(`Most of what you spent went toward ${replay.topIntent.intent.toLowerCase()}.`);
  }

  return lines;
}
