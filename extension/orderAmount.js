// Finds the real order total on a checkout page. Deliberately text-based
// rather than per-site CSS selectors — retailers change their DOM/class
// names constantly (especially Amazon's A/B-tested checkout), so a
// selector list would break within weeks. Scanning rendered text for a
// dollar amount next to a "total" label is slower but far more durable.

const MONEY_PATTERN = /\$\s?([\d,]+\.\d{2})/;
const STRONG_LABELS = [/order total/i, /grand total/i, /total due/i, /amount due/i];
// Matches "Total" but not "Subtotal" or "Estimated tax" — a bare negative
// lookbehind isn't available in all embedded JS engines, so this checks
// explicitly instead.
const WEAK_LABEL = /\btotal\b/i;
const EXCLUDED_NEAR_WEAK = /sub\s*total/i;

function parseAmountCents(text) {
  const match = text.match(MONEY_PATTERN);
  if (!match) return null;
  const dollars = parseFloat(match[1].replace(/,/g, ""));
  if (!Number.isFinite(dollars)) return null;
  return Math.round(dollars * 100);
}

function getVisibleLines() {
  const raw = document.body.innerText || "";
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Returns the order total in cents, or null if nothing confident was found.
 * Confidence order: a strong label ("order total", "grand total", ...) on
 * the same or next line beats a bare "total" line, which itself is only
 * used if nothing stronger turned up anywhere on the page. Pure function
 * over pre-split lines so it's testable without a DOM — findOrderTotalCents
 * below is the thin document.body.innerText wrapper actually used at
 * runtime.
 */
function findTotalFromLines(lines) {
  let weakCandidate = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] ?? "";

    const isStrongLabel = STRONG_LABELS.some((re) => re.test(line));
    if (isStrongLabel) {
      const inline = parseAmountCents(line);
      if (inline != null) return inline;
      const onNext = parseAmountCents(next);
      if (onNext != null) return onNext;
    }

    if (WEAK_LABEL.test(line) && !EXCLUDED_NEAR_WEAK.test(line) && weakCandidate == null) {
      const inline = parseAmountCents(line);
      if (inline != null) {
        weakCandidate = inline;
      } else {
        const onNext = parseAmountCents(next);
        if (onNext != null) weakCandidate = onNext;
      }
    }
  }

  return weakCandidate;
}

function findOrderTotalCents() {
  return findTotalFromLines(getVisibleLines());
}

if (typeof module !== "undefined") {
  module.exports = { findOrderTotalCents, findTotalFromLines, parseAmountCents };
}
