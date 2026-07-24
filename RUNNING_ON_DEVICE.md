# Running Checkpoint on a physical phone

These steps assume you're running them from a terminal on the machine
you're physically at (not a remote/sandboxed session) — Expo Go needs to
reach the dev server over the network or a USB cable, and that only works
from a machine with real access to your phone.

## Option A — Wi-Fi, no cable

```bash
cd checkpoint
npm install -g @expo/ngrok
npx expo start --tunnel
```

Install **Expo Go** from the Play Store (Android) or App Store (iOS), then
scan the QR code that prints in the terminal.

`--tunnel` routes through ngrok rather than your LAN, so it works even if
your phone and computer aren't on the same Wi-Fi network — useful on
guest/corporate networks that block local device discovery. If both are on
the same trusted Wi-Fi, plain `npx expo start` (LAN mode, no tunnel) is
faster to connect and doesn't need `@expo/ngrok` installed.

## Option B — USB cable (Android, most reliable)

Skips networking and tunnels entirely — the fix if tunnel mode is flaky on
your network.

1. Enable **Developer Options** on the phone (Settings → About phone → tap
   "Build number" 7 times), then enable **USB debugging** inside Developer
   Options
2. Plug the phone into the computer via USB, accept the debugging prompt on
   the phone
3. From the project folder:
   ```bash
   adb reverse tcp:8081 tcp:8081
   npx expo start
   ```
4. Open Expo Go on the phone — it should detect the local server
   automatically. If not, enter `exp://localhost:8081` manually.

(`adb` ships with Android Studio's platform-tools, or install standalone via
`npm install -g @expo/cli` doesn't include it — grab platform-tools from
Android's developer site if `adb` isn't already on your PATH.)

## Known limitation: bank linking

The "Connect your bank" button (Settings → Bank connection) uses
`react-native-plaid-link-sdk`, a native module Expo Go doesn't include.
Tapping it in Expo Go will show a caught error message rather than connect —
this is handled gracefully (`usePlaidLink.ts` wraps the native calls in
try/catch), not a crash. Everything else in the app — Home, Decision Mode,
Decisions history, Future You, Settings — works normally.

To actually test bank linking on-device, you need a custom EAS build (dev
client or standalone) rather than Expo Go, since that's the only way to
include Plaid's native code. That's a separate, larger step — ask if you
want it scoped out.
