# Eko Nights: self-hosted with Firebase

This folder is the complete website. It works in three modes:

- **Offline (default):** `public/firebase-config.js` is `null`. Anyone can play. Progress is saved in each player's browser.
- **Online, free plan:** paste your Firebase config with `verified: false`. Players sign in with Google or as a guest and get everything online: officer directory, friend codes, friends, squads of up to 4, invites, backup partners, live positions inside a squad, and progress that syncs across devices. Each player's browser reports their own stats, so this is for friends and testing.
- **Online, verified (for a public launch):** `verified: true` plus the Cloud Functions in `functions/`. Rank, XP, case stats, names and friend codes are kept by your server, so the leaderboard can be trusted. Needs the pay-as-you-go **Blaze** plan.

```
public/
  index.html               the game
  manifest.webmanifest     home-screen app settings (full screen, landscape) and icons
  eko-online.js            connects the game to Firebase (sign-in, database, live presence, server calls)
  firebase-config.js       YOUR Firebase settings go here
  vendor/                  three.js and the Firebase SDK, served from your own domain
functions/
  index.js                 the verified service record (cases, XP, names, invites)
  names.js                 the online name filter: edit the word lists here
firestore.rules            security rules for verified mode
firestore.spark.rules      security rules for free-plan mode
firestore.indexes.json     the leaderboard index
database.rules.json        security rules for live presence
firebase.json              hosting, rules and functions deployment settings
```

## 1. Create the Firebase project (about 15 minutes)

1. Go to <https://console.firebase.google.com> and click **Create a project**. Name it, for example `eko-nights`. Google Analytics is optional.
2. **Add a web app:** Project overview → the `</>` icon → give it a name → **Register app**. Copy the `firebaseConfig` object it shows you.
3. **Authentication** → Get started → **Sign-in method**:
   - Enable **Google**.
   - Enable **Anonymous**. This is the "Play as guest" button.
4. **Firestore Database** → Create database → **Production mode**. Pick a location: `africa-south1` (Johannesburg) is closest to Nigeria, `europe-west1` is a good alternative. The location can't be changed later.
5. **Realtime Database** → Create database → location `europe-west1` → **Locked mode**. Copy the database URL shown at the top of the Data tab (it ends in `firebasedatabase.app` or `firebaseio.com`).
6. **For verified mode:** upgrade to the **Blaze** plan (Usage and billing → Modify plan) and set a budget alert straight away (see "Before a big launch").

## 2. Paste your config

Open `public/firebase-config.js` and replace `null` with your config:

```js
window.EKO_FIREBASE = {
  apiKey: "AIza...",
  authDomain: "eko-nights.firebaseapp.com",
  projectId: "eko-nights",
  databaseURL: "https://eko-nights-default-rtdb.europe-west1.firebasedatabase.app",
  appId: "1:1234567890:web:abcdef",
  verified: true,                 // false for free-plan mode
  appCheckKey: "6Lc..."           // optional: see "App Check" below
};
```

These values are not secrets. Firebase web config is meant to be public. Your data is protected by the security rules and, in verified mode, by the Cloud Functions.

## 3. Deploy

You need Node.js installed. Then, in this folder:

```bash
npm install -g firebase-tools
firebase login
firebase use --add                       # pick your project, alias "default"
cd functions && npm install && cd ..     # verified mode only
firebase deploy                          # website, rules, leaderboard index and functions
```

Your game is now live at `https://<project-id>.web.app`.

**Free-plan mode instead:** the Spark plan can't run Cloud Functions. Set `verified: false`, then:

```bash
cp firestore.spark.rules firestore.rules
firebase deploy --only hosting,firestore,database
```

**Always deploy the rules.** Without them, Firestore and the Realtime Database refuse every read and write. If you host the website somewhere else (Vercel, Netlify, cPanel), still deploy everything except hosting:

```bash
firebase deploy --only firestore,database,functions
```

The functions run in `europe-west1`. If you change the region in `functions/index.js`, also set `functionsRegion` in `firebase-config.js`.

## 4. Use your own domain

- **Firebase Hosting:** Hosting → **Add custom domain** → follow the DNS steps at your domain registrar. The HTTPS certificate is free and automatic.
- **Then:** Authentication → Settings → **Authorized domains** → add your domain (for example `ekonights.ng`). Google sign-in only works on authorized domains.

## The verified service record

In verified mode, players can't write their own rank, XP, stats, name or friend code. The functions in `functions/index.js` do:

- **`registerOfficer`:** checks the officer's name, gives each officer a unique friend code (`EKO-` plus 5 characters), and allows one name change a day. A rejected name shows as "Officer XXXXX" until the player picks another.
- **`startCase`:** records the case and the start time on the server's clock. At most 15 new cases an hour per player. Joining a squad only works for the host's real open case.
- **`closeCase`:** checks the result and computes the XP on the server:
  - A solve faster than the minimum for that case type is refused, for example 5 minutes for a homicide. Squad-mates are timed from when the case began, so someone who joins late isn't penalised.
  - Arrests are capped at the case's gang size.
  - A case can only be closed once, and only by the player who started it.
  - After 40 solved cases in a day, cases still count but give no XP.
  - Three refused claims flag the account, which removes it from the leaderboard. Strikes wear off: a week without a refused claim clears them.
- **Backup credit:** when you close a case with an offline officer as backup, the server gives them 60 XP. At most 3 credits a day for the same pair, so friends can't farm XP for each other.
- **`sendInvite`:** only to online officers, only from an open squad, at most 10 every 10 minutes.

**What this stops and what it doesn't:** it stops edited stats, instant wins, inflated arrests, replayed cases, invite spam and XP farming. These were all tried against the emulators and refused. The case itself still runs on the player's device, so a skilled cheater who plays at a believable pace with a modified game can't be caught by these checks. Stopping that would need the server to run each case, which is a much bigger change. Eko Nights has no prizes, so it isn't worth doing: the checks are there to keep the leaderboard fair and fun, not to be airtight.

To tune the limits, edit `TYPES` and `LIMITS` near the top of `functions/index.js` and redeploy.

### The name filter

`functions/names.js` has three lists:

- **Blocked anywhere in a name:** strong profanity and slurs.
- **Blocked only as a whole name:** words that are rude alone but appear inside ordinary names. "Gbola" is blocked but "Gbolahan" is fine, and "Dick" is blocked but "Dickson" is fine.
- **Reserved:** names like admin, moderator and staff.

It catches common letter swaps (0 for o, 1 for i, and so on) and accents. Add words as you see real names come in, then run `firebase deploy --only functions`.

## App Check

App Check makes sure requests come from your real game on your domain, not from scripts.

1. Google Cloud console → **Security → reCAPTCHA** → create a **website** key for your domain(s).
2. Firebase console → **App Check** → your web app → **reCAPTCHA Enterprise** → paste the site key → Save.
3. Put the same site key in `firebase-config.js` as `appCheckKey` and redeploy hosting.
4. Watch the App Check metrics for a day or two. When almost all requests show as verified, click **Enforce** for Cloud Firestore and Realtime Database. The Cloud Functions already require App Check outside the emulator.

## What the security rules enforce

**Verified mode (`firestore.rules`):**
- **Profiles:** signed-in players can read the officer directory. Each player can only update their own presence fields: last seen, current case and squad. Everything else is written by the functions.
- **Server-only records:** case tickets are readable only by their owner. Credits and friend codes are server-only. Each player's inbox (invites, backup credits) is readable only by its owner.
- **Squad state:** readable by signed-in players. Each player writes only their own.
- **Saves:** private to their owner.
- **The `config/live` switches:** anyone can read them, and nobody can change them from the game.

**Free-plan mode (`firestore.spark.rules`):** each player writes only their own profile, squad state, invites and credits, with basic checks on profile values.

**Live presence (`database.rules.json`, both modes):** a player can only write their own presence entry, so nobody can impersonate someone else in a squad.

## How the online features stay cheap at scale

- **No global lobby.** Nobody listens to "everyone online". A player's online status is a timestamp in their profile, refreshed every 5 minutes.
- **The officer directory is fetched when you open it, never live.** It loads the top 20 officers, open squads (up to 30) and your friends (up to 30), and caches them for a minute. Finding a friend by code is one lookup.
- **Live positions are only shared inside a squad,** at most 4 officers, about 2–3 updates a second and only while moving. Squads can be spread across several Realtime Database instances (see below).
- **Cloud saves** happen at most every 2 minutes, within about 20 seconds of something important (a rank-up, a story step, a new case, clue or arrest), and when the app is closed or goes to the background. Progress is also saved on the device every few seconds.

Rough usage per player per hour of play:
- about 40–60 Firestore writes;
- around 100 reads, mostly from opening the Officers tab;
- in verified mode, two function calls per case;
- for squad play only, a few hundred KB of Realtime Database traffic.

## Low-end phones

- **Automatic quality.** The game measures its own frame rate while you play. If it stays under about 26 frames a second, it steps down one level at a time: lower resolution, then no shadows, then less traffic and fewer people. The level is remembered on the device. Picking a graphics option on the title screen resets it.
- **Touch devices start on "Performance" graphics.**
- **Landscape only on phones.** Eko Nights is played sideways:
  - **Rotate prompt:** a phone held upright shows a "Turn your phone sideways" screen.
  - **Starting a shift:** on Android, tapping "Start shift" goes full screen and locks the screen to landscape. iPhone doesn't allow websites to lock orientation, so it relies on the prompt.
  - **Home-screen app:** `manifest.webmanifest` lets players add the game to their home screen. It then opens full screen in landscape with the Eko Nights icon.
  - **Short-screen layout:** on screens under 500 px tall the layout is compact. The HUD sits in the corners, speed and radar sit between the thumb pads, and the dialogue, MDT and title screen are sized to fit.

Tested in a desktop browser emulating a 360 px phone with the CPU slowed 6× (roughly a budget Android). The game logic costs about 1–2 ms a frame, so drawing the 3D city is what decides smoothness, and that depends on the phone's GPU. **Test on a few real phones before launch,** ideally including a cheap one with 2–3 GB of RAM.

## Free Spark plan limits

- **Realtime Database: 100 simultaneous connections.** Every signed-in player with the game open counts as one. Upgrade to **Blaze** before any public launch.
- **Firestore:** 50,000 reads and 20,000 writes per day, roughly 300–400 hours of play a day.
- **Hosting:** 10 GB of downloads a month. The game is about 1.9 MB, or about 560 KB compressed, so roughly 18,000 first-time loads a month.

## Before a big launch

### 1. Set budget alerts (do this first)

Google Cloud console → **Billing** → **Budgets & alerts** → **Create budget** for your Firebase project. Set, for example, a monthly budget with alerts at 50%, 90% and 100%, emailed to you. Alerts don't stop spending on their own, which is what the kill switch below is for.

### 2. The kill switch

In Firestore, create a collection `config` with a document `live`:

| Field | Type | Effect |
|---|---|---|
| `online` | boolean | `false` pauses all online features. Players keep playing and saving on their device, and are told online play is paused. |
| `squads` | boolean | `false` turns off squads and live positions only. Profiles and cloud saves keep working. |
| `message` | string | Shown to players (in the Officers tab, and when online play is paused). |
| `minVersion` | number | If higher than the game's version (currently 3), players are told to reload to get the update. |

Games check this document when they start and every 10 minutes. With no document, everything is on. Only you can change it, from the Firebase console.

### 3. Spread squads across several databases

One Realtime Database instance handles up to 200,000 connections, but Firebase recommends staying under about 1,000 writes a second per instance. A squad of 4 all on the move sends about 10 updates a second (less when people stand still), so plan one instance per 100–200 squads playing at the same moment.

1. Realtime Database → **Add database** (Blaze plan) → create, for example, `eko-nights-rooms-2` and `eko-nights-rooms-3`.
2. In `firebase-config.js`, list them all:
   ```js
   databaseURLs: ["https://eko-nights-default-rtdb.europe-west1.firebasedatabase.app",
                  "https://eko-nights-rooms-2.europe-west1.firebasedatabase.app",
                  "https://eko-nights-rooms-3.europe-west1.firebasedatabase.app"],
   ```
   Keep `databaseURL` set to the first one.
3. Deploy the same rules to every instance by changing `"database"` in `firebase.json` to:
   ```json
   "database": [
     {"instance": "eko-nights-default-rtdb", "rules": "database.rules.json"},
     {"instance": "eko-nights-rooms-2", "rules": "database.rules.json"},
     {"instance": "eko-nights-rooms-3", "rules": "database.rules.json"}
   ]
   ```

Each squad always lands on the same instance (by a hash of its name), so squad-mates always meet. Adding instances later only moves squads that start after the change.

### 4. Launch in stages

Open to a few hundred players first and watch **Usage and billing** for a few days. Work out your cost per player before you open the doors.

## Known limits

- **Sign-in options:** guest accounts live on one device until the player taps **Link Google**. Phone-number sign-in isn't wired up yet.
- **What squads share:** squad-mates share the case (clues, arrests, closing) and see each other in the city. Traffic, chases and raids still run separately on each player's screen.
- **Two progress records:** your rank for unlocking cases is kept on your device. The verified record on the leaderboard is kept by the server. They can differ, for example after offline play, which the server doesn't count.

## Testing locally with the emulators

```bash
cd functions && npm install && cd ..
firebase emulators:start --project demo-eko
```

Then, in `public/firebase-config.js`, use:

```js
window.EKO_FIREBASE = {apiKey:"demo-key", authDomain:"demo-eko.firebaseapp.com", projectId:"demo-eko",
  databaseURL:"https://demo-eko-default-rtdb.firebaseio.com", appId:"1:1:web:1", emulators:true, verified:true};
```

Serve `public/` with any static server (for example `npx serve public`) and open it in two browser windows to play together. App Check is skipped in the emulator.
