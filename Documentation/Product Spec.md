# Product Spec — "Pod" (working name)
### Squad-Based Nutrition & Fitness Accountability App

---

## 0. One-Line Pitch

A calorie/macro tracker where you never log alone — you and 3–8 friends ("your Pod") see each other's meals, streaks, and challenges in a shared feed, turning daily nutrition tracking into a group game instead of a solo chore.

---

## 1. Look & Feel / Brand Guidelines

### 1.1 Brand Personality
Warm, playful, a little cheeky — closer to BeReal/Duolingo energy than a clinical health app. The app should feel like a group chat with your closest friends, not a spreadsheet. Confidence and humor over guilt and clinical precision.

### 1.2 Color Palette
- **Primary — Pod Coral** `#FF5C5C` — CTAs, streak flames, primary buttons
- **Secondary — Squad Teal** `#0FB5AE` — secondary actions, progress rings, group badges
- **Accent — Sunbeam Yellow** `#FFC93C` — celebratory states, unlocks, confetti, badges
- **Neutral Dark — Ink** `#1B1B1F` — primary text, dark mode background
- **Neutral Light — Cloud** `#F7F5F2` — light mode background (warm off-white, not clinical white)
- **Success — Mint** `#36D399`
- **Alert — Ember** `#FF7849` (used sparingly — never shame-red)

Avoid clinical blues/greens associated with MyFitnessPal/Lifesum. Avoid pure white backgrounds (too "medical app").

### 1.3 Typography
- **Display/Headlines:** Cabinet Grotesk or General Sans (Bold/Extrabold) — rounded, confident, modern geometric sans. Used for streak counts, big numbers, celebratory moments.
- **Body/UI:** Inter or General Sans (Regular/Medium) — high legibility for logs, lists, comments.
- **Numerals:** Tabular figures everywhere (calories, macros, streak counts) so numbers don't jitter when updating.

### 1.4 Visual Style
- **Illustration, not stock photography.** Custom flat-vector avatars/mascots (a "Pod" blob character per user, customizable) — cheaper to animate, more shareable, more ownable than food photography.
- **Rounded corners everywhere** (16–24px radius cards) — friendly, not sterile.
- **Soft drop shadows + subtle gradients** on cards (coral→yellow) for celebratory states (streak milestones, challenge wins).
- **Motion:** Snappy spring-physics micro-animations (confetti burst on logging streaks, blob "high-five" animation when a podmate reacts to your meal). Motion should feel tactile — designed to be screen-recorded.
- **Iconography:** Rounded, filled icons (not thin-line) — more legible at small sizes in screenshots/video.

### 1.5 Tone of Voice
- Short, funny, peer-to-peer copy. Never clinical ("Caloric intake logged") — instead conversational ("Nice, logged 🔥 your pod's gonna see that"). 
- Push notifications written like a friend would text you, not like a health app.
- No moralizing language about food ("bad food," "cheat day") — ever. Differentiator vs. WeightWatchers/Noom guilt-driven copy.

---

## 2. Core Functionality

### 2.1 Foundation (table stakes — must match incumbents)
- AI photo-scan food logging (camera → calorie/macro estimate), barcode scan, manual/search entry
- Macro + calorie targets (adaptive, recalculated weekly from weight-trend data — borrow MacroFactor's approach as baseline, don't compete on this alone)
- Weight/progress tracking with trend-line smoothing
- Wearable sync (Apple Health, Google Fit, Whoop, Oura)

### 2.2 The Differentiator: Pods
- **Pod creation:** Form a private group of 3–8 people via invite link/QR code (no public discovery — privacy and intimacy is the point, unlike public leaderboard apps).
- **Shared feed:** Each logged meal/workout posts a small card to your Pod's private feed — photo, macros, optional caption. Podmates can react with emoji or quick voice-note replies (max 10 sec).
- **Group streaks:** The Pod has a *collective* streak (everyone logs at least once that day) in addition to individual streaks. One person breaking it puts gentle, funny social pressure on the group — not shame, but stakes.
- **Weekly Pod Challenges:** Rotating, lightweight competitions scoped to *effort*, not outcome (most consistent logger, most protein hit, most workouts) — avoids the "global leaderboard demotivates laggards" trap by keeping cohorts small and chosen.
- **Pod Wagers (optional, opt-in):** Friends can stake small in-app currency or real money (via Stripe) on a weekly challenge — loser buys the group something (coffee fund via Venmo/Apple Cash deep link). High shareability ("my pod made me pay for losing").

### 2.3 The Virality Layer (built for organic + paid social)
These are the specific features designed to *generate* shareable, screen-recordable, ad-able moments — not afterthoughts bolted onto a dashboard.

1. **Auto-Generated Pod Recap Reels** — Every Sunday, the app auto-edits a 15-second vertical video recap of your Pod's week (streaks, funniest reactions, biggest win) using each member's logged photos + reactions, ready to post directly to TikTok/IG Stories/Snapchat with the app's logo. This is the single highest-leverage growth feature — it productizes Cal AI's "creator content" model as an automatic, zero-cost-to-acquire feature instead of a manual influencer-outreach operation.
2. **"Roast or Hype" AI commentary** — optional AI co-host that drops a one-line, personality-driven reaction to each logged meal (selectable voice: hype-man, deadpan roast, drill sergeant), visible to the Pod and easily screenshotted.
3. **Invite-gated core loop** — meaningful value (the feed, the streak, the challenges) requires at least 2 friends to join; the share/invite flow is the onboarding flow, not a separate feature. Built-in K-factor.
4. **Pod Wager receipts** — shareable, stylized "loss/win" cards when a wager resolves, designed explicitly to be screenshot bait (mirrors why people share Venmo/Wordle/BeReal results).
5. **Public "Pod Spotlight" (opt-in, anonymized)** — best Pod recap reels of the week, curated and reposted by the brand's own TikTok/IG account, with creators' consent — gives the brand a constant pipeline of authentic UGC ad creative at near-zero cost, directly informed by Cal AI's influencer-seeding playbook but inverted: users become the influencers instead of paid creators.

### 2.4 Monetization
- Freemium: free tracking + 1 Pod (up to 5 members); Premium ($7.99/mo or $59.99/yr) unlocks multiple Pods, AI roast voices, advanced macro adaptation, unlimited recap reel exports/customization, and real-money wagers.

---

## 3. Primary Screens

### Screen 1 — Pod Feed (Home)
The default landing screen. A vertical scroll of your Pod's recent logged meals/workouts as cards (photo thumbnail, name + avatar blob, macros, reactions row, AI roast/hype line). Top bar shows the Pod's collective streak flame + count. Floating action button (camera icon) for instant logging. This screen *is* the product — replaces the "diary" screen incumbents lead with.

### Screen 2 — Log a Meal (Camera/Scan)
Full-screen camera viewfinder (AI photo scan front and center, matching the "demoable in 3 seconds" Cal AI insight), with quick toggles for barcode/manual search. After capture: editable macro breakdown, optional caption, toggle "share to Pod" (on by default), and a one-tap "post" button. Confirmation triggers the confetti/blob animation.

### Screen 3 — My Progress
Personal dashboard: adaptive calorie/macro targets, weight trend graph, individual streak calendar, weekly summary stats. Functionally similar to MacroFactor/Cronometer dashboards — this is the "serious" screen for users who also want rigor, kept secondary to the social feed.

### Screen 4 — Pod Challenges & Wagers
List of active/upcoming weekly challenges with live leaderboard scoped to just your Pod, progress bars per member, and the Wager module (stake setup, resolution, shareable result card). This is the engagement/retention engine.

### Screen 5 — Recap Reel
Auto-generated weekly video player (full-screen vertical video, TikTok-style), with one-tap "Share to Instagram/TikTok/Snapchat" buttons, a re-roll/edit option (swap clips, change music), and a "Send to Pod" action. This is the growth engine — the screen explicitly designed to be screen-recorded or shared off-platform.

### Screen 6 — Create/Join a Pod (Onboarding)
Simple flow: create a Pod, name it, generate an invite link/QR code; or join via a link. Reinforces that the app is unusable solo beyond a basic tracker — friends are required to unlock the core loop, driving the invite-based growth flywheel from first session.

---

*End of spec.*
