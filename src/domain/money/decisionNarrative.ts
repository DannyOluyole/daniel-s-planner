import { WallVerdict } from "./applyPurchase";
import { SavingsGoal } from "@domain/entities/SavingsGoal";
import { money } from "@domain/entities/MoneyState";
import { FinancialTimeline } from "./financialTimeline";

export interface DecisionNarrative {
  /** The story, not the balance — what this purchase actually does. */
  headline: string;
  /** 0-100. How well this purchase aligns with staying on track. */
  score: number;
  scoreLabel: string;
  /** A callback to the user's own "Future Self" answer from onboarding —
   * null when they never set one. Kept separate from `headline` since it's
   * an emotional aside, not the primary verdict. */
  futureSelfNote: string | null;
}

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Converts a dollar shortfall into a rough day estimate by assuming a
 * linear savings pace toward the goal's target date — not precise
 * accounting, just enough to make the delay tangible ("5 days" lands
 * differently than "$40"). Returns null when there's no target date or
 * pace to reason from, so callers fall back to a dollar-amount phrasing.
 */
function estimateDelayDays(dipsIntoGoalBy: number, goal: SavingsGoal | null): number | null {
  if (!goal?.targetDate || dipsIntoGoalBy <= 0 || goal.targetCents <= 0) return null;
  const totalDays = (new Date(goal.targetDate).getTime() - new Date(goal.createdAt).getTime()) / DAY_MS;
  if (totalDays <= 0) return null;
  const dailyPace = goal.targetCents / totalDays;
  if (dailyPace <= 0) return null;
  return Math.max(1, Math.round(dipsIntoGoalBy / dailyPace));
}

/** Parses a YYYY-MM-DD timeline date key back into local month/day words —
 * never through `new Date(string)`, which parses as UTC and can print a
 * day early or late depending on the device's timezone. */
function formatShortfallDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function lowerFirst(s: string): string {
  return s.length > 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/**
 * A callback to the user's own "Future Self" answer from onboarding — reads
 * differently depending on whether this purchase is actually a concern, so
 * it never contradicts the main headline above it.
 */
function buildFutureSelfNote(isConcern: boolean, futureVision: string | null | undefined): string | null {
  const vision = futureVision?.trim();
  if (!vision) return null;
  const phrased = lowerFirst(vision);
  return isConcern
    ? `This won't stop ${phrased}, but waiting until your next payday keeps you exactly on schedule.`
    : `You're getting closer to ${phrased} every week.`;
}

export function buildDecisionNarrative(
  verdict: WallVerdict,
  amountCents: number,
  goal: SavingsGoal | null,
  timeline?: FinancialTimeline | null,
  futureVision?: string | null
): DecisionNarrative {
  const usageRatio = amountCents / Math.max(verdict.beforeCents, 1);
  let score = Math.round(100 - usageRatio * 50);

  let headline: string;
  if (timeline?.causesShortfall) {
    // Going negative before the next paycheck is a sharper, more concrete
    // problem than dipping into a savings goal — it takes priority over the
    // goal-dip messaging below even when both are true.
    const shortBy = Math.abs(timeline.lowestBalanceCents);
    headline = timeline.lowestBalanceDate
      ? `This leaves you short by ${money(shortBy)} before ${formatShortfallDate(timeline.lowestBalanceDate)}.`
      : `This leaves you short by ${money(shortBy)} before your next paycheck.`;
    score = Math.min(score, 25);
  } else if (verdict.tone === "warn") {
    const goalName = goal?.name ?? "your savings goal";
    const delayDays = estimateDelayDays(verdict.dipsIntoGoalBy, goal);
    headline =
      delayDays != null
        ? `This purchase delays ${goalName} by about ${delayDays} ${delayDays === 1 ? "day" : "days"}.`
        : `This purchase dips into ${goalName} by ${money(verdict.dipsIntoGoalBy)}.`;

    const dipRatio = goal ? verdict.dipsIntoGoalBy / Math.max(goal.targetCents, 1) : 0.5;
    score -= Math.round(20 + dipRatio * 50);
  } else {
    headline = "This purchase keeps you on track.";
  }

  score = Math.max(3, Math.min(99, score));

  const scoreLabel =
    score >= 80
      ? "Excellent decision"
      : score >= 60
      ? "Good decision"
      : score >= 40
      ? "Worth a second thought"
      : "Think twice";

  const isConcern = Boolean(timeline?.causesShortfall) || verdict.tone === "warn";
  const futureSelfNote = buildFutureSelfNote(isConcern, futureVision);

  return { headline, score, scoreLabel, futureSelfNote };
}
