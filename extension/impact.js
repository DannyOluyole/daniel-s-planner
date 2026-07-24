// Fetches the signed-in user's real balance + savings goals + upcoming
// income/bills via Supabase's REST API directly (same tables the app itself
// reads), and computes the same personalized impact Decision Mode shows
// on-device — ported to plain JS since this extension has no build step to
// share the app's TypeScript domain modules directly. Mirrors
// src/domain/money/applyPurchase.ts, decisionNarrative.ts, and
// financialTimeline.ts — kept in sync by hand.

async function fetchBankLinkStatus(session) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/plaid_items?select=status&user_id=eq.${session.userId}&order=created_at.desc&limit=1`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.accessToken}` } }
  );
  if (!res.ok) return false;
  const rows = await res.json();
  return rows[0]?.status === "linked";
}

async function fetchMoneyStateSnapshot(session) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/money_states?select=available_cents&user_id=eq.${session.userId}&order=as_of.desc&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.accessToken}`,
      },
    }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

// Every goal that's still active — not just one — since a purchase can be
// compared against several at once (see selectDippedGoal below).
async function fetchSavingsGoals(session) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/savings_goals?select=name,target_cents,target_date,created_at,removed_at&user_id=eq.${session.userId}&order=created_at.desc`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.accessToken}` } }
  );
  if (!res.ok) return [];
  const rows = await res.json();
  return rows.filter((g) => !g.removed_at);
}

async function fetchIncome(session) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/income?select=amount_cents,day_of_month,created_at,removed_at&user_id=eq.${session.userId}`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.accessToken}` } }
  );
  if (!res.ok) return [];
  return res.json();
}

async function fetchCommitments(session) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/commitments?select=type,amount_cents,day_of_month,created_at,removed_at&user_id=eq.${session.userId}`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.accessToken}` } }
  );
  if (!res.ok) return [];
  return res.json();
}

async function fetchDecisions(session) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/spending_decisions?select=amount_cents,outcome,decided_at&user_id=eq.${session.userId}&order=decided_at.desc&limit=200`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.accessToken}` } }
  );
  if (!res.ok) return [];
  return res.json();
}

function formatMoney(cents) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// --- Live balance derivation — mirrors activeDuringMonth.ts + ---
// --- categoryImpact.ts's sumContinuedThisMonth, for whenever there's no ---
// --- bank-synced snapshot to trust (no bank linked, or a just-linked ---
// --- account whose first sync hasn't landed yet). --------------------

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function monthBounds(monthDate) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function wasActiveDuringMonth(createdAt, removedAt, monthDate) {
  const { start, end } = monthBounds(monthDate);
  const created = new Date(createdAt);
  if (created > end) return false;
  if (removedAt) {
    const removed = new Date(removedAt);
    if (removed < start) return false;
  }
  return true;
}

function sumActiveDuringMonth(items, monthDate) {
  return items
    .filter((i) => wasActiveDuringMonth(i.created_at, i.removed_at, monthDate))
    .reduce((sum, i) => sum + i.amount_cents, 0);
}

function sumContinuedThisMonth(decisions, now) {
  return decisions
    .filter((d) => d.outcome === "continued" && isSameMonth(new Date(d.decided_at), now))
    .reduce((sum, d) => sum + d.amount_cents, 0);
}

// --- Financial Timeline — mirrors financialTimeline.ts exactly, ---
// --- including the same-day-occurrence fix (comparing against a ---
// --- date-only version of "now", not the exact current timestamp). ---

const DAY_MS = 1000 * 60 * 60 * 24;

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateForDay(year, month, day) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, daysInMonth));
}

function occurrencesWithinHorizon(dayOfMonth, from, horizonEnd) {
  const day = dayOfMonth ?? 1;
  const dates = [];
  const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let candidate = dateForDay(from.getFullYear(), from.getMonth(), day);
  if (candidate < fromDateOnly) {
    candidate = dateForDay(from.getFullYear(), from.getMonth() + 1, day);
  }
  while (candidate <= horizonEnd) {
    dates.push(candidate);
    candidate = dateForDay(candidate.getFullYear(), candidate.getMonth() + 1, day);
  }
  return dates;
}

function buildFinancialTimeline(availableCents, income, commitments, hypotheticalAmountCents, now, horizonDays = 45) {
  const horizonEnd = new Date(now.getTime() + horizonDays * DAY_MS);
  const events = [];

  for (const item of income.filter((i) => !i.removed_at)) {
    for (const date of occurrencesWithinHorizon(item.day_of_month, now, horizonEnd)) {
      events.push({ date: toDateKey(date), amountCents: item.amount_cents, kind: "income" });
    }
  }
  for (const item of commitments.filter((c) => !c.removed_at && c.type !== "variable")) {
    for (const date of occurrencesWithinHorizon(item.day_of_month, now, horizonEnd)) {
      events.push({ date: toDateKey(date), amountCents: -item.amount_cents, kind: "commitment" });
    }
  }
  if (hypotheticalAmountCents != null) {
    events.push({ date: toDateKey(now), amountCents: -hypotheticalAmountCents, kind: "hypothetical" });
  }

  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let balance = availableCents;
  const runningBalances = [];
  let lowestBalanceCents = availableCents;
  let lowestBalanceDate = null;
  for (const event of events) {
    balance += event.amountCents;
    runningBalances.push(balance);
    if (balance < lowestBalanceCents) {
      lowestBalanceCents = balance;
      lowestBalanceDate = event.date;
    }
  }

  const firstIncomeIndex = events.findIndex((e) => e.kind === "income");
  const relevantBalances = firstIncomeIndex === -1 ? runningBalances : runningBalances.slice(0, firstIncomeIndex + 1);
  const causesShortfall = relevantBalances.some((b) => b < 0);

  return { events, runningBalances, lowestBalanceCents, lowestBalanceDate, causesShortfall };
}

function formatShortfallDate(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// --- Goal selection — mirrors applyPurchase.ts's selectDippedGoal. ---

function selectDippedGoal(goals, afterCents) {
  const dipped = goals.filter((g) => afterCents < g.target_cents);
  if (dipped.length === 0) return null;
  return dipped.reduce((nearest, g) => (g.target_cents < nearest.target_cents ? g : nearest));
}

const DAY_MS_GOAL = 1000 * 60 * 60 * 24;

function estimateDelayDays(dipsIntoGoalByCents, goal) {
  if (!goal || !goal.target_date || dipsIntoGoalByCents <= 0 || goal.target_cents <= 0) return null;
  const totalDays = (new Date(goal.target_date).getTime() - new Date(goal.created_at).getTime()) / DAY_MS_GOAL;
  if (totalDays <= 0) return null;
  const dailyPace = goal.target_cents / totalDays;
  if (dailyPace <= 0) return null;
  return Math.max(1, Math.round(dipsIntoGoalByCents / dailyPace));
}

/**
 * Pure scoring, mirrors decisionNarrative.ts exactly — including a real
 * timeline shortfall taking priority over a goal dip, since going negative
 * before the next paycheck is a sharper problem than eating into savings.
 */
function computeImpact(orderAmountCents, beforeCents, goal, timeline) {
  if (beforeCents == null) return null;

  const afterCents = beforeCents - orderAmountCents;
  const goalTarget = goal ? goal.target_cents : null;
  const dipsIntoGoalBy = goalTarget != null && afterCents < goalTarget ? goalTarget - afterCents : 0;

  const usageRatio = orderAmountCents / Math.max(beforeCents, 1);
  let score = Math.round(100 - usageRatio * 50);

  let headline;
  if (timeline && timeline.causesShortfall) {
    const shortBy = Math.abs(timeline.lowestBalanceCents);
    headline = timeline.lowestBalanceDate
      ? `This leaves you short by ${formatMoney(shortBy)} before ${formatShortfallDate(timeline.lowestBalanceDate)}.`
      : `This leaves you short by ${formatMoney(shortBy)} before your next paycheck.`;
    score = Math.min(score, 25);
  } else if (dipsIntoGoalBy > 0) {
    const goalName = goal && goal.name ? goal.name : "your savings goal";
    const delayDays = estimateDelayDays(dipsIntoGoalBy, goal);
    headline =
      delayDays != null
        ? `This purchase delays ${goalName} by about ${delayDays} ${delayDays === 1 ? "day" : "days"}.`
        : `This purchase dips into ${goalName} by ${formatMoney(dipsIntoGoalBy)}.`;
    const dipRatio = goalTarget ? dipsIntoGoalBy / Math.max(goalTarget, 1) : 0.5;
    score -= Math.round(20 + dipRatio * 50);
  } else {
    headline = "This purchase keeps you on track.";
  }

  score = Math.max(3, Math.min(99, score));
  const scoreLabel =
    score >= 80 ? "Excellent decision" : score >= 60 ? "Good decision" : score >= 40 ? "Worth a second thought" : "Think twice";

  return { headline, score, scoreLabel };
}

/**
 * End-to-end: given a signed-in session and the scraped order amount,
 * returns the impact to show, or null if there's nothing to compute against
 * (every fetch failed, say) — callers fall back to the generic prompt in
 * that case.
 */
async function getPersonalizedImpact(session, orderAmountCents) {
  try {
    const [isBankLinked, goals, income, commitments] = await Promise.all([
      fetchBankLinkStatus(session),
      fetchSavingsGoals(session),
      fetchIncome(session),
      fetchCommitments(session),
    ]);

    let beforeCents = null;
    if (isBankLinked) {
      const snapshot = await fetchMoneyStateSnapshot(session);
      if (snapshot) beforeCents = snapshot.available_cents;
    }

    // No bank linked (or a just-linked account with no synced snapshot
    // yet) — derive live from income, commitments, and this month's
    // decisions, the same formula the app itself uses for the
    // non-bank-linked case, instead of leaving this user with no
    // personalization at all.
    if (beforeCents == null) {
      const decisions = await fetchDecisions(session);
      const now = new Date();
      const protectedCents = sumActiveDuringMonth(commitments, now);
      const totalIncomeCents = sumActiveDuringMonth(income, now);
      const spentThisMonth = sumContinuedThisMonth(decisions, now);
      beforeCents = totalIncomeCents - protectedCents - spentThisMonth;
    }

    const afterCents = beforeCents - orderAmountCents;
    const goal = selectDippedGoal(goals, afterCents);
    const timeline = buildFinancialTimeline(beforeCents, income, commitments, orderAmountCents, new Date());

    return computeImpact(orderAmountCents, beforeCents, goal, timeline);
  } catch {
    return null;
  }
}

if (typeof module !== "undefined") {
  module.exports = {
    computeImpact,
    formatMoney,
    getPersonalizedImpact,
    selectDippedGoal,
    buildFinancialTimeline,
  };
}
