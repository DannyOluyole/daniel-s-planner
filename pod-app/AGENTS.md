# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

Pinned to SDK 57 because that's what the installed Expo Go app supports
(check via the app itself — Profile tab shows supported SDK versions — this
moves over time, so don't assume 57 is still current by the time you read
this). If Expo Go crashes instantly on scan with no error message, that's
the signature of an SDK mismatch, not a real crash in this code.

**Native-module versions must match Expo's bundledNativeModules.json for the
target SDK exactly** — `npm install <pkg>@latest` is NOT safe for anything
with native code (async-storage, safe-area-context, screens, image-picker,
etc.), because Expo Go ships a prebuilt binary with specific native module
versions baked in; a newer JS-side package version than what's bundled
crashes instantly on-device while working completely fine on web (web has no
native binary to mismatch against). `npx expo install` resolves this
automatically in a normal environment, but this sandbox's egress policy
blocks `api.expo.dev`, which `expo install` needs — so versions here were
verified manually against
`https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo/bundledNativeModules.json`.
Re-check that file (swap `sdk-57` for whatever SDK you're on) before bumping
any native-module version.
