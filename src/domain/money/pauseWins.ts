import { SpendingDecision } from "@domain/entities/MoneyState";
import { sumMoneyProtected } from "./decisionJournal";

export interface PauseWinsStats {
  pauses: number;
  skipped: number;
  moneyKeptCents: number;
  /** % of decisions that were paused or reconsidered rather than continued
   * straight through — the app's honest stand-in for "intentional decision
   * rate": every logged decision already went through Decision Mode, so the
   * meaningful signal isn't "did they decide" (always true) but "how often
   * did they actually step back." */
  intentionalRate: number;
}

export interface PauseWins {
  weekly: PauseWinsStats;
  lifetime: PauseWinsStats;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function summarize(decisions: SpendingDecision[]): PauseWinsStats {
  const pauses = decisions.filter((d) => d.outcome === "paused" || d.outcome === "reconsidered").length;
  const skipped = decisions.filter((d) => d.outcome === "reconsidered").length;
  const moneyKeptCents = sumMoneyProtected(decisions);
  const intentionalRate = decisions.length > 0 ? Math.round((pauses / decisions.length) * 100) : 0;
  return { pauses, skipped, moneyKeptCents, intentionalRate };
}

/**
 * The doc's "Pause Wins" concept: reward pausing itself, not just money
 * saved, and show it as accumulated wins rather than a spending scoreboard.
 * Weekly and lifetime are independent summaries over the same decisions —
 * no separate query, just two filtered passes.
 */
export function computePauseWins(decisions: SpendingDecision[], now: Date = new Date()): PauseWins {
  const weekAgo = now.getTime() - WEEK_MS;
  const weekly = decisions.filter((d) => new Date(d.decidedAt).getTime() >= weekAgo);
  return {
    weekly: summarize(weekly),
    lifetime: summarize(decisions),
  };
}

interface PauseLevelThreshold {
  name: string;
  at: number;
}

// Exact thresholds from the habit-loop doc — identity over points, so no
// score/XP number is attached, just a name and how many pauses until the
// next one.
const PAUSE_LEVELS: PauseLevelThreshold[] = [
  { name: "The Starter", at: 10 },
  { name: "The Thinker", at: 25 },
  { name: "The Intentional Spender", at: 50 },
  { name: "The Money Protector", at: 100 },
];

export interface PauseLevel {
  /** Null before the first threshold (10 pauses) is reached — there's no
   * "level 0" identity to claim yet. */
  name: string | null;
  pauses: number;
  nextAt: number | null;
  nextName: string | null;
}

export function computePauseLevel(lifetimePauses: number): PauseLevel {
  let current: PauseLevelThreshold | null = null;
  let next: PauseLevelThreshold | null = null;
  for (const level of PAUSE_LEVELS) {
    if (lifetimePauses >= level.at) {
      current = level;
    } else if (!next) {
      next = level;
    }
  }
  return {
    name: current?.name ?? null,
    pauses: lifetimePauses,
    nextAt: next?.at ?? null,
    nextName: next?.name ?? null,
  };
}
