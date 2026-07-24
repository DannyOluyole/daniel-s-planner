// Sanity checks for the checkout matcher and order-amount scraper. Run: node test.js
const assert = require("node:assert");
const { isCheckoutUrl } = require("./checkoutMatcher");
const { findTotalFromLines, parseAmountCents } = require("./orderAmount");
const { computeImpact, selectDippedGoal, buildFinancialTimeline } = require("./impact");

const shouldMatch = [
  "https://www.amazon.com/gp/buy/spc/handlers/display.html",
  "https://www.amazon.ca/checkout/p/p-105",
  "https://www.bestbuy.com/checkout/r/fulfillment",
  "https://www.nike.com/checkout",
  "https://www.apple.com/shop/checkout",
  "https://www.walmart.com/checkout/review-order",
  "https://www.etsy.com/checkout/payment",
  "https://www.target.com/co",
  "https://www.costco.com/CheckoutCartDisplayView",
  "https://www.homedepot.com/checkout/review",
  "https://www.lowes.com/checkout",
  "https://www.wayfair.com/checkout",
  "https://www.ikea.com/us/en/checkout",
  "https://www.macys.com/checkout",
  "https://www.kohls.com/checkout",
  "https://www.sephora.com/checkout",
  "https://www.ulta.com/checkout",
  "https://www.nordstrom.com/checkout",
  "https://www.gamestop.com/checkout",
  "https://www.temu.com/checkout",
  "https://www.shein.com/cart/checkout",
  "https://www.aliexpress.com/p/trade/confirm.html",
];

const shouldNotMatch = [
  "https://www.amazon.com/dp/B0EXAMPLE",
  "https://www.amazon.com/gp/cart/view.html",
  "https://www.nike.com/t/air-max-shoes",
  "https://www.apple.com/shop/buy-iphone",
  "https://www.google.com/checkout",
  "http://www.amazon.com/gp/buy/spc",
  "not a url",
  "https://www.target.com/p/some-product/-/A-12345",
  "https://www.costco.com/electronics.html",
  "https://www.wayfair.com/furniture/pdp/some-sofa.html",
  "https://www.shein.com/some-dress-p-12345.html",
  "https://www.aliexpress.com/item/12345.html",
];

for (const url of shouldMatch) {
  assert.ok(isCheckoutUrl(url), `expected MATCH: ${url}`);
}
for (const url of shouldNotMatch) {
  assert.ok(!isCheckoutUrl(url), `expected NO match: ${url}`);
}
console.log(`ok — ${shouldMatch.length} checkout URLs matched, ${shouldNotMatch.length} non-checkout URLs ignored`);

assert.strictEqual(parseAmountCents("Order total: $52.00"), 5200);
assert.strictEqual(parseAmountCents("$1,204.99"), 120499);
assert.strictEqual(parseAmountCents("no money here"), null);

// Strong label, amount on the same line.
assert.strictEqual(
  findTotalFromLines(["Subtotal", "$45.00", "Estimated tax", "$3.60", "Order total", "$48.60"]),
  4860
);
// Strong label with the amount on the next line specifically.
assert.strictEqual(findTotalFromLines(["Grand total", "$99.99"]), 9999);
// Only a bare "Total" (no stronger label anywhere) — weak match still used,
// but "Subtotal" must never be mistaken for it.
assert.strictEqual(findTotalFromLines(["Subtotal", "$10.00", "Total", "$12.50"]), 1250);
// Nothing total-like on the page at all.
assert.strictEqual(findTotalFromLines(["Shipping", "$5.00", "Item price", "$20.00"]), null);
console.log("ok — order total scraper resolved every fixture correctly");

// A purchase well within Available and nowhere near the goal — on track.
{
  const impact = computeImpact(2000, 100000, null, null);
  assert.strictEqual(impact.headline, "This purchase keeps you on track.");
  assert.ok(impact.score >= 80, `expected a high score, got ${impact.score}`);
  assert.strictEqual(impact.scoreLabel, "Excellent decision");
}

// A purchase that dips into a dated goal — delay estimated in days.
{
  const goal = {
    name: "Trip",
    target_cents: 100000,
    created_at: "2026-01-01T00:00:00Z",
    target_date: "2026-11-01T00:00:00Z", // ~304 days, ~329 cents/day pace
  };
  const impact = computeImpact(90000, 95000, goal, null);
  assert.ok(impact.headline.includes("delays Trip by about"), impact.headline);
  assert.ok(impact.score < 60, `expected a low score, got ${impact.score}`);
}

// A goal with no target date — falls back to a dollar-amount phrasing.
{
  const goal = { name: "Cushion", target_cents: 50000, created_at: "2026-01-01T00:00:00Z", target_date: null };
  const impact = computeImpact(90000, 95000, goal, null);
  assert.strictEqual(impact.headline, "This purchase dips into Cushion by $450.00.");
}

// No synced balance at all — nothing to compute against.
assert.strictEqual(computeImpact(500, null, null, null), null);

// A real timeline shortfall takes priority over a goal dip, even when both
// are true for the same purchase — going negative before payday is the
// sharper, more concrete problem.
{
  const goal = { name: "Cushion", target_cents: 50000, created_at: "2026-01-01T00:00:00Z", target_date: null };
  const timeline = { causesShortfall: true, lowestBalanceCents: -3565, lowestBalanceDate: "2026-07-23" };
  const impact = computeImpact(5000, 14350, goal, timeline);
  assert.ok(impact.headline.includes("short by $35.65 before Jul 23"), impact.headline);
  assert.ok(impact.score <= 25, `expected a capped low score, got ${impact.score}`);
  assert.strictEqual(impact.scoreLabel, "Think twice");
}

console.log("ok — impact calculator matches the app's decision-narrative logic");

// selectDippedGoal — picks whichever active goal's target the post-purchase
// balance would newly dip below, preferring the nearest (lowest) target
// among several, matching src/domain/money/applyPurchase.ts.
{
  const goals = [
    { name: "Cushion", target_cents: 50000 },
    { name: "Trip to Japan", target_cents: 25000 },
  ];
  const picked = selectDippedGoal(goals, 20000);
  assert.strictEqual(picked.name, "Trip to Japan");
  assert.strictEqual(selectDippedGoal(goals, 60000), null);
}
console.log("ok — selectDippedGoal matches the app's multi-goal selection");

// buildFinancialTimeline — same math as src/domain/money/financialTimeline.ts,
// including the same-day-occurrence fix: an item due exactly today (even
// when "now" has a non-midnight time, as it always does in real usage) must
// still show up rather than silently rolling to next month.
{
  const afternoon = new Date(2026, 6, 10, 14, 32); // July 10, 2:32pm
  const income = [{ amount_cents: 200000, day_of_month: 10, created_at: "2026-01-01", removed_at: null }];
  const timeline = buildFinancialTimeline(50000, income, [], null, afternoon, 45);
  assert.strictEqual(timeline.events[0].date, "2026-07-10");
  assert.strictEqual(timeline.runningBalances[0], 250000);
}
{
  // A bill before the next paycheck causes a shortfall.
  const now = new Date(2026, 6, 10);
  const income = [{ amount_cents: 200000, day_of_month: 25, created_at: "2026-01-01", removed_at: null }];
  const commitments = [
    { type: "fixed", amount_cents: 30000, day_of_month: 12, created_at: "2026-01-01", removed_at: null },
  ];
  const timeline = buildFinancialTimeline(20000, income, commitments, null, now, 45);
  assert.strictEqual(timeline.causesShortfall, true);
  assert.strictEqual(timeline.lowestBalanceCents, -10000);
}
console.log("ok — buildFinancialTimeline matches the app's projection engine");
