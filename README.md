# Checkpoint

A financial *mindfulness* app, not a budgeting app. The signature feature is
the **Spending Wall** — a calm checkpoint screen that appears before a
purchase completes, giving the user a beat to decide, not a rulebook to
obey.

## Stack

- **Expo + React Native + TypeScript**
- **NativeWind (Tailwind for RN)** for styling
- **Supabase** for auth + data
- **React Navigation** (native-stack)
- **react-native-reanimated** + **react-native-svg** for the Wall's motion and meter

## Architecture

Clean, layered, feature-first:

```
src/
  core/        # theme tokens, copy/strings, supabase client — no domain logic
  domain/      # entities + repository interfaces — no framework imports
  data/        # concrete repository implementations (Supabase today)
  features/    # one folder per feature (home, spending-wall, future-you)
  shared/      # cross-feature UI primitives (Button, Card, Screen) and hooks
```

Screens depend on `CheckpointRepository` (an interface), never on Supabase
directly — swapping in a bank-aggregator SDK later means writing one new
class in `data/`, not touching any screen.

## The vocabulary layer

Every user-facing money word routes through `src/core/copy/strings.ts`. That
file is the single place that encodes Checkpoint's tone:

| Instead of      | Checkpoint says   |
|------------------|-------------------|
| Budget           | Available / Protected |
| Expenses         | Protected for… |
| Transactions     | Decisions |
| Over budget      | Stretched thin |
| Save             | Set aside |
| (checkout wall)  | Checkpoint |

No screen should hardcode a finance word — import from `Copy` instead. This
is what keeps the tone consistent as the app grows, and the one place to
evolve it later.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project values
npx expo start
```

For running on a physical phone via Expo Go (Wi-Fi tunnel or USB), see
[RUNNING_ON_DEVICE.md](./RUNNING_ON_DEVICE.md).

Environment variables (Expo public vars, safe for client bundling — RLS does
the real enforcement):

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Supabase schema

Run the files in `supabase/migrations/` in order, in your Supabase project's
SQL editor:

1. `0001_core.sql` — `money_states` (append-only snapshot log) and
   `spending_decisions`, RLS scoped to `auth.uid()`. Includes an insert
   policy on `money_states` because the client now writes a new snapshot
   directly when a decision is `"continued"` (see "Manual purchases" below).
2. `0002_savings_goals.sql` — one goal per user (`target_cents`,
   optional `target_date`), what the Wall checks a purchase against.
3. `0003_plaid_items.sql` — bank-connection status (extends the schema
   below in "Bank connection (Plaid)").

## Where the Spending Wall lives

`src/features/spending-wall/SpendingWallScreen.tsx` presents as a full-screen
modal. It enforces a short mandatory pause (`MIN_PAUSE_MS`, currently 2.2s)
before "Continue" becomes tappable — the mechanism behind "this screen won't
rush you." Every resolution (`continued` / `paused` / `reconsidered`) is
recorded with how long the user actually paused, which is the seed of a
future "how you decide" insight feature.

## Appearance (dark mode)

`src/core/theme/ThemeContext.tsx` provides a `ThemeProvider` wrapping the app
in `App.tsx`, with a `useTheme()` hook every themed component reads from
(never RN's raw `useColorScheme` directly — that's what makes the in-app
toggle actually override the device setting). Preference (`system` / `light`
/ `dark`) persists via AsyncStorage. The toggle itself lives in
`src/shared/components/ThemeToggle.tsx`, surfaced on the Settings screen.

## Onboarding

First launch shows `src/features/onboarding/OnboardingScreen.tsx` — four
paged slides (`slides.ts`) introducing Available/Protected, the Checkpoint
pause, and Future You, before the user ever sees Home. Gate state lives in
`OnboardingContext.tsx` (wrapping the app in `App.tsx`), backed by
AsyncStorage (`onboardingStorage.ts`). Settings' "Replay intro" calls
`replay()` from that context, which flips state immediately — no relaunch
needed, since `Root` in `App.tsx` reads `onboarded` straight from context.

## Decisions history

`src/features/decisions/DecisionsScreen.tsx` lists past Checkpoint outcomes
via `getRecentDecisions` (already defined on `CheckpointRepository` — no new
repository work needed). Each row (`DecisionRow.tsx`) shows the merchant,
amount, and a quiet colored dot for outcome (Continued / Paused /
Reconsidered), using `Copy.outcomeLabel` so the vocabulary stays consistent.
Reachable from a "See Decisions" link on Home.

## Auth

`src/core/auth/AuthContext.tsx` wraps the app in `App.tsx` (outermost, before
Theme/Onboarding) and exposes `useAuth()` — `session`, `user`,
`signInWithPassword`, `signUpWithPassword`, `signOut`, all backed directly by
Supabase Auth (`supabase.auth.*`), with `onAuthStateChange` keeping session
state live.

Gate order in `Root` (`App.tsx`): **auth → onboarding → main nav.** A
signed-out user sees `AuthScreen` (email/password, toggles between sign in
and sign up) before onboarding is ever checked. Every screen that used to
take a hardcoded `DEMO_USER_ID` (`HomeScreen`, `SpendingWallScreen`,
`FutureYouScreen`, `DecisionsScreen`) now reads `useAuth().user?.id`
instead — no repository code changed, since they always took a `userId`
string. Settings has an Account card showing the signed-in email and a Sign
out button.

The suggested schema above already assumes this: both tables reference
`auth.users`, and the RLS policies check `auth.uid() = user_id`, so no
schema changes are needed to go from demo data to real accounts.

## Bank connection (Plaid)

Plaid access tokens must never reach the RN app, so this splits into two
layers:

- **Client** (`src/data/plaid/SupabasePlaidRepository.ts`, implementing the
  new `BankLinkRepository` domain interface) only calls Supabase Edge
  Functions and reads connection status from `plaid_items.status` — it never
  sees an access token.
- **Server** (`supabase/functions/`) holds the Plaid client ID/secret as
  Supabase secrets and does the real work:
  - `plaid-create-link-token` — mints the token the native Link UI needs to open
  - `plaid-exchange-token` — exchanges Link's public token for a stored
    access token, then runs an immediate sync
  - `plaid-sync` — re-pulls balances on demand (pull-to-refresh, or wire to
    a scheduled job later) and writes a new `money_states` row
  - `_shared/sync.ts` computes Available/Protected/Future You from raw
    account balances — documented in-file as a **heuristic starting
    point** (checking → Available, savings → Protected, investment →
    Future You), meant to be refined once real commitments/goals exist

`src/features/link-account/` is the UI: `usePlaidLink` wraps
`react-native-plaid-link-sdk`'s native Link flow, `LinkAccountScreen` shows
connection status and the connect CTA, reachable from Settings → "Connect
your bank."

Deploy and configure with:

```bash
supabase functions deploy plaid-create-link-token
supabase functions deploy plaid-exchange-token
supabase functions deploy plaid-sync

supabase secrets set PLAID_CLIENT_ID=... PLAID_SECRET=... PLAID_ENV=sandbox
```

Schema: `supabase/migrations/0003_plaid_items.sql` (see "Supabase schema" above).

## Manual purchases (no bank linked)

`src/features/spending-wall/NewDecisionScreen.tsx` is the real entry point
for logging a purchase — merchant/category + amount, then straight into the
Wall. `HomeScreen`'s "Open Checkpoint" button navigates here instead of the
old hardcoded demo values. On "Continue," `CheckpointRepository.recordDecision`
now also debits `availableCents` (via the pure `applyPurchase` function in
`src/domain/money/applyPurchase.ts`) by inserting a fresh `money_states`
snapshot — this is what makes Available correct for a user who's never
connected a bank. Paused/reconsidered decisions never touch the numbers.

The Wall itself (`SpendingWallScreen.tsx`) shows the before/after ledger and
a verdict (ok/warn) via `computeWallVerdict`, checked against the user's
`SavingsGoal` (see below) — the actual "does this dip into savings" check
the Product Vision describes.

## Savings goal

`src/domain/entities/SavingsGoal.ts` + two new `CheckpointRepository` methods
(`getSavingsGoal`, `setSavingsGoal`) back a single goal per user (schema:
`0002_savings_goals.sql`). It's set right after onboarding
(`src/features/onboarding/components/SavingsGoalStep.tsx`) and editable later
from `FutureYouScreen`, which is also now reachable — tapping the "Future
You" card on Home navigates there (previously an orphaned route).

## Local/demo mode (no Supabase project yet)

`src/core/config/supabase.ts` exports `supabaseConfigured` (true once
`EXPO_PUBLIC_SUPABASE_URL`/`_ANON_KEY` are set). `src/data/repositories.ts`
picks `LocalCheckpointRepository`/`LocalBankLinkRepository` (in-memory,
seeded with fixture numbers) instead of the Supabase-backed ones when
unconfigured, and `AuthContext` synthesizes a stable local demo session
instead of calling `supabase.auth.*`. This is what makes the whole app
click-through-able before a real Supabase project exists — flip both env
vars and everything switches to real auth + persistence with no other code
changes.

## Next build steps

- Decisions currently shows the last 20 with no pagination — add infinite
  scroll or date grouping once real data volume shows up
- No password-reset or magic-link flow yet — `AuthScreen` only covers
  email/password sign in and sign up
- The Available/Protected/Future You heuristic in `_shared/sync.ts` is a
  first pass — revisit once there's a real model for commitments and goals
- Nothing calls `plaid-sync` on a schedule yet; wire a Supabase cron job or
  pull-to-refresh on Home
- Plaid credentials need to be created in the Plaid dashboard and set as
  Supabase secrets before this is testable end-to-end
- Real push notifications (`expo-notifications`) — not built yet, needs
  physical-device testing
