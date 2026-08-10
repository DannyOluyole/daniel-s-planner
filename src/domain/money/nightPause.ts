import { SpendingDecision } from "@domain/entities/MoneyState";

export interface TemptationWindow {
  /** 0 = Sunday, matching Date#getDay(). */
  weekday: number;
  /** Inclusive, 0-23. */
  startHour: number;
  /** Exclusive, always startHour + 3 — a 3-hour block never wraps past 24
   * since blocks are aligned to 0-3, 3-6, ... 21-24. */
  endHour: number;
}

// Needs real history before claiming a pattern exists at all, and the peak
// block needs to be a real repeat, not one or two purchases that happened
// to land in the same 3-hour slot.
const MIN_TOTAL_DECISIONS = 5;
const MIN_PEAK_COUNT = 3;
const BLOCK_HOURS = 3;

/**
 * The doc's "we've noticed something — Friday nights 9PM-12AM" idea:
 * buckets decisions by weekday + 3-hour block and returns the block they
 * cluster in most, or null when there isn't enough signal yet. A real
 * pattern or nothing — never a guess from thin data (mirrors
 * highestSpendingWeekday's same-shaped minimum-sample floor in
 * weeklySpendInsight.ts).
 */
export function detectPeakTemptationWindow(decisions: SpendingDecision[]): TemptationWindow | null {
  if (decisions.length < MIN_TOTAL_DECISIONS) return null;

  const counts = new Map<string, number>();
  for (const d of decisions) {
    const date = new Date(d.decidedAt);
    const weekday = date.getDay();
    const block = Math.floor(date.getHours() / BLOCK_HOURS);
    const key = `${weekday}-${block}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let bestKey: string | null = null;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  if (!bestKey || bestCount < MIN_PEAK_COUNT) return null;

  const [weekdayStr, blockStr] = bestKey.split("-");
  const startHour = Number(blockStr) * BLOCK_HOURS;
  return { weekday: Number(weekdayStr), startHour, endHour: startHour + BLOCK_HOURS };
}

/** Whether `now` falls inside a previously detected/accepted window. */
export function isWithinTemptationWindow(window: TemptationWindow, now: Date = new Date()): boolean {
  if (now.getDay() !== window.weekday) return false;
  const hour = now.getHours();
  return hour >= window.startHour && hour < window.endHour;
}
