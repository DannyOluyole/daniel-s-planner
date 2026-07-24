# Checkpoint browser extension (Stage 3)

A quiet pause at online checkouts. When you reach an order-review page on a
supported store — Amazon, Best Buy, Nike, Apple, Walmart, eBay, Etsy, Target,
Costco, Home Depot, Lowe's, Wayfair, IKEA, Macy's, Kohl's, Sephora, Ulta,
Nordstrom, GameStop, Temu, Shein, or AliExpress — a small Checkpoint card
appears in the corner. Sign in once via the toolbar icon and
it upgrades from a generic prompt into a real dollar-impact check — "This
purchase delays your Trip fund by about 5 days" — computed from your actual
synced balance and savings goal, the same way Decision Mode itself reasons
about a purchase. It never blocks the page or touches the order form.

## Install (unpacked, for development)

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode**
3. **Load unpacked** → select this `extension/` folder
4. Click the Checkpoint icon in the toolbar and sign in with your Checkpoint
   account (optional — the overlay still works without this, just generic)
5. Visit a supported store's checkout page

## What it does

- `checkoutMatcher.js` — decides whether the current URL is genuinely a
  checkout/order-review page (deliberately conservative; product pages and
  carts never trigger it)
- `orderAmount.js` — scans the rendered page text for the real order total,
  next to a "total" label. Text-based on purpose: retailer DOM/class names
  change constantly, especially on A/B-tested checkout flows, so this is
  more durable than per-site CSS selectors.
- `session.js` / `popup.html` / `popup.js` — sign-in via Supabase Auth's
  REST API directly (no bundler here, so the full SDK isn't practical),
  storing the session in `chrome.storage.local` and refreshing it as needed.
- `impact.js` — once signed in, fetches the real balance (bank-synced if
  linked, otherwise derived live from income/bills/decisions, same as the
  app), every active savings goal, and upcoming income/bills, then computes
  the same narrative + Financial Alignment Score Decision Mode shows
  on-device — including the Financial Timeline shortfall check ("this
  leaves you short by $X before your next paycheck"), which takes priority
  over a savings-goal dip, and multi-goal selection (whichever goal's target
  the purchase would newly dip below). Kept in sync by hand with
  `src/domain/money/decisionNarrative.ts`, `applyPurchase.ts`, and
  `financialTimeline.ts` since this extension can't import the app's
  TypeScript modules directly.
- `content.js` — injects the overlay immediately with the generic prompt
  (never makes the pause itself wait on a network round trip), then
  upgrades it in place if personalization resolves. Shows a quiet hint to
  sign in when it can't personalize because there's no session yet.

## Known limitations

- `checkpoint://decision` only resolves if the Checkpoint app is installed
  and registered for the scheme on this device; swap `DECISION_URL` in
  `content.js` for the hosted web app URL when one exists.
- Personalization requires the order total scraper to confidently find a
  "total" line on the page — an unusual checkout layout falls back to the
  generic prompt rather than guessing.
- Checkout URL patterns and the total-scraping heuristic are best-effort and
  will need maintenance as stores change their flows. The original 7 stores
  (Amazon, Best Buy, Nike, Apple, Walmart, eBay, Etsy) were confirmed
  end-to-end; the 15 added afterward follow common checkout-path conventions
  but haven't each been individually run through a live purchase flow —
  treat those as a starting point to verify per store, not a guarantee.
- The stored session persists until its refresh token expires or the user
  signs out — there's no cross-device session management here, it's local
  to this browser profile.

## Test

```
node test.js
```
