// Streak math shared by individual ("did I log today?") and group
// ("did everyone in the Pod log today?") streaks. Callers reduce their raw
// data down to a plain list of "streak-eligible" date keys and pass it here.

/** Local-timezone YYYY-MM-DD key for a timestamp, so "today" matches the device's day. */
export function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toLocalDateKey(date.toISOString());
}

/**
 * Counts consecutive eligible days ending at today (or yesterday, so the
 * streak doesn't visually reset to 0 just because today hasn't happened yet).
 * `eligibleDateKeys` need not be sorted or deduped.
 */
export function computeStreak(eligibleDateKeys: string[], today: string = toLocalDateKey(new Date().toISOString())): number {
  const days = new Set(eligibleDateKeys);
  if (days.size === 0) return 0;

  let cursor = days.has(today) ? today : addDays(today, -1);
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Group streak: a day only counts if every member of `memberIds` logged that day. */
export function computeGroupStreak(
  memberIds: string[],
  loggedDatesByUser: Record<string, string[]>,
  today?: string
): number {
  if (memberIds.length === 0) return 0;

  const perUserDaySets = memberIds.map((id) => new Set(loggedDatesByUser[id] ?? []));
  const allDays = new Set(perUserDaySets.flatMap((s) => Array.from(s)));

  const fullyCoveredDays = Array.from(allDays).filter((day) => perUserDaySets.every((s) => s.has(day)));

  return computeStreak(fullyCoveredDays, today);
}
