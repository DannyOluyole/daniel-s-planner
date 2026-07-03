# Pod — mobile app (v1 core loop)

React Native (Expo Router) app implementing the "never log alone" core loop from
`Documentation/Product Spec.md`: auth, create/join a Pod, manual meal logging,
shared feed with reactions, individual + group daily streaks.

Deliberately **out of scope for v1**: AI photo-scan macro estimation, weekly
challenges, wagers, auto-generated recap reels, AI roast/hype commentary,
wearable sync. Those layer on top of this once the core loop is proven.

## Stack

- Expo SDK 54 + Expo Router (file-based navigation, see `app/`) — **pinned
  deliberately**, not "whatever's latest": the standalone Expo Go app (App
  Store / Play Store) only supports SDK 54 right now. Bumping this without
  checking Expo Go's currently-supported SDK first will build fine but crash
  instantly the moment you open it in Expo Go.
- Plain React Native `StyleSheet` + `src/theme/index.ts` for the brand system
  (NativeWind was skipped — its newer-SDK setup uses tooling
  (`nativewind@preview`, `react-native-css`) that isn't worth the risk for an
  MVP; StyleSheet gets the same visual result with zero extra risk)
- Supabase: Postgres + Auth + Storage + Row Level Security (`supabase/schema.sql`)

## First-time setup

1. **Create a Supabase project** at supabase.com (free tier is plenty for this stage).
2. **Run the schema**: open the SQL Editor in your Supabase project, paste the
   entire contents of `supabase/schema.sql`, and run it. This creates all
   tables, RLS policies, the `meal-photos` storage bucket, and a trigger that
   auto-creates a `profiles` row whenever someone signs up.
3. **Get your API keys**: Project Settings → API → copy the Project URL and
   the `anon` `public` key.
4. **Configure the app**: `cp .env.example .env` and fill in
   `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` from step 3.
5. Install dependencies (`npm install` — **not** `npx expo install`; this
   sandbox's egress policy blocks `api.expo.dev`, which `expo install` calls
   for a compatibility check that plain `npm install` skips) and run:
   ```bash
   npm run web    # fastest way to sanity-check UI changes
   npm run ios    # requires Xcode / a Mac, or Expo Go on a physical device
   npm run android
   ```

## Core loop implemented

- `app/sign-in.tsx`, `app/sign-up.tsx` — Supabase email/password auth
- `app/onboarding.tsx` — create a Pod (generates a 6-character invite code) or
  join one by code; enforced 8-member cap via a DB trigger
- `app/(tabs)/index.tsx` — Pod Feed Home: meal cards, 🔥 reactions,
  group-streak badge, floating **+** button
- `app/log-meal.tsx` — modal: manual macro entry + optional photo (uploads to
  the `meal-photos` Storage bucket), "share to Pod" toggle
- `app/(tabs)/profile.tsx` — your own streak + sign out
- `src/lib/streak.ts` — shared streak math (individual: logged at least once
  today-or-yesterday-and-counting-back; group: every Pod member logged that day)

## What's verified vs. not

Verified in this sandbox (its network egress policy blocks `api.expo.dev`,
`*.supabase.co`, etc., so nothing requiring live network access could be
tested here):
- TypeScript compiles clean (`npx tsc --noEmit`)
- The Expo Router / Metro bundle builds with no errors on both `web` and
  `android` platforms
- `sign-in` / `sign-up` render correctly and navigate between each other
  (confirmed visually via a headless-browser screenshot)
- The app correctly surfaces (rather than crashing on) a failed Supabase
  request — confirmed by triggering a real sign-up against a live project's
  credentials from this sandbox and watching it fail gracefully with
  "Failed to fetch" (expected here, since the sandbox can't reach
  `supabase.co` — not a sign of a real bug)

**Not yet verified**: the actual data flow (create/join Pod → post a meal →
see it in the feed → streaks update → reactions). That needs to run
somewhere with normal internet access — your own machine via `npx expo
start` + Expo Go, or `npm run web`. Run through that flow once for real
before treating this as done.
