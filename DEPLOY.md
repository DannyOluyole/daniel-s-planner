# ScreenGuard — Deploy to Play Store & App Store

## Project Structure

```
daniel-s-planner/
├── www/                          ← Web app (HTML/CSS/JS)
│   ├── index.html                ← Main ScreenGuard app
│   ├── styles.css                ← Shared styles
│   └── native-bridge.js          ← JS ↔ Native plugin bridge
│
├── android/                      ← Android native project (Capacitor)
│   └── app/src/main/java/com/screenguard/app/
│       ├── MainActivity.java     ← Registers native plugins
│       └── plugins/
│           ├── ScreenTimePlugin.java    ← Real app usage stats
│           ├── BlockerPlugin.java       ← Start/stop VPN blocking
│           └── ScreenGuardVpnService.java ← DNS-intercept VPN
│
├── ios/                          ← iOS native project (Capacitor)
│   ├── App/App/
│   │   ├── BlockerPlugin.swift   ← NEFilterManager wrapper
│   │   └── ScreenTimePlugin.swift ← Screen Time API stub
│   └── ScreenGuardFilter/
│       └── FilterProvider.swift  ← Network Extension (DNS filter)
│
├── .github/workflows/
│   ├── build-android.yml         ← CI: builds APK + AAB
│   └── build-ios.yml             ← CI: builds IPA on macOS runner
│
├── capacitor.config.json         ← Capacitor settings
├── package.json
└── ExportOptions.plist           ← iOS export config
```

---

## One-time local setup

```bash
npm install --legacy-peer-deps
npx cap sync           # copy www/ → android/ and ios/
```

---

## Android — Google Play Store

### Step 1: Generate a signing keystore

```bash
keytool -genkey -v -keystore screenguard.keystore \
  -alias screenguard -keyalg RSA -keysize 2048 -validity 10000
```

Keep this file safe — you cannot update your app without it.

### Step 2: Build a release AAB

Option A — GitHub Actions (no Android Studio needed):
1. Base64-encode your keystore: `base64 -i screenguard.keystore`
2. In your GitHub repo → Settings → Secrets, add:
   - `KEYSTORE_BASE64` = output of step above
   - `KEY_ALIAS` = `screenguard`
   - `KEY_PASSWORD` = your key password
   - `STORE_PASSWORD` = your keystore password
3. Push to `main` — the AAB will be available as a GitHub Actions artifact.

Option B — Android Studio locally:
```bash
npx cap open android    # opens Android Studio
# Build → Generate Signed Bundle/APK → Android App Bundle
```

### Step 3: Publish to Play Store
1. Go to play.google.com/console → Create app
2. Fill in store listing (screenshots, description, content rating)
3. Upload the `.aab` to the Internal Testing track first
4. **Content rating**: During the questionnaire, answer honestly about adult content
   blocking — it's a *parental control / wellness* app, which is fine.
5. **Permissions declaration**: You'll need to justify `PACKAGE_USAGE_STATS`
   (screen time monitoring) and `BIND_VPN_SERVICE` (website blocking).
   Use this justification:
   > "ScreenGuard is a digital wellness app that helps users monitor and reduce
   > screen addiction. PACKAGE_USAGE_STATS is used to show users their own app
   > usage for self-monitoring. BIND_VPN_SERVICE creates a local VPN that blocks
   > distracting and harmful websites based on a user-configured blocklist."

---

## iOS — Apple App Store

### Step 1: Apple Developer account ($99/yr)
Sign up at developer.apple.com.

### Step 2: App identifiers & entitlements
1. In developer.apple.com/account → Certificates, IDs & Profiles:
   - Create App ID: `com.screenguard.app`
   - Enable capabilities: **Network Extensions** (Content Filter), **App Groups**
   - Create App Group: `group.com.screenguard.app` (for sharing blocklist with extension)
2. Create a second App ID for the filter extension: `com.screenguard.app.filter`
3. Create an App Store provisioning profile for each.

### Step 3: Request Network Extension entitlement
Go to: developer.apple.com/contact/request/
Select "Network Extensions Content Filter" and describe your use case:
> "ScreenGuard is a screen addiction recovery app. The Content Filter is used
> to block adult content and addictive websites that users have added to their
> own blocklist. This helps users recovering from pornography addiction and
> screen addiction maintain accountability."

Apple typically approves wellness/parental control apps within 1–2 weeks.

### Step 4: Add ScreenGuardFilter target in Xcode
1. `npx cap open ios` (requires Xcode on Mac, or use GitHub Actions)
2. File → New → Target → Network Extension
3. Name: `ScreenGuardFilter`, type: `Content Filter`
4. Add `ios/ScreenGuardFilter/FilterProvider.swift` to the new target
5. In the App Group capability, add `group.com.screenguard.app` to **both** targets

### Step 5: Build with GitHub Actions (no Mac needed)
1. Export your distribution certificate as a `.p12` from Keychain Access
2. Add to GitHub Secrets:
   - `IOS_CERTIFICATE_BASE64` = `base64 -i certificate.p12`
   - `IOS_CERTIFICATE_PASSWORD` = p12 export password
   - `IOS_PROVISIONING_PROFILE_BASE64` = `base64 -i ScreenGuard.mobileprovision`
   - `IOS_KEYCHAIN_PASSWORD` = any random password for CI keychain
3. Update `ExportOptions.plist` with your Apple Team ID
4. Push to `main` — IPA artifact is built on a macOS GitHub runner

### Step 6: Upload to App Store
Use Transporter app (Mac) or `xcrun altool` / `xcrun notarytool` to upload the IPA.
Or use the App Store Connect web upload if available.

---

## App Store Review Notes

**Play Store review**: VPN apps and apps dealing with adult content require you to
fill out a Sensitive Apps declaration. Be transparent — wellness/blocking apps are
approved routinely. Expected review time: 2–7 days.

**App Store review**: Apple is stricter. Key things to mention in your review notes:
- The app does NOT access other users' data
- VPN / Content Filter is used only with explicit user consent
- Adult content blocking is a parental control / wellness feature
- No server-side data collection
Expected review time: 1–3 days for initial, 24–48h for updates.

---

## Environment Variables Summary

| Secret | Used for | Where to get it |
|--------|----------|-----------------|
| `KEYSTORE_BASE64` | Android release signing | Generated with `keytool` |
| `KEY_ALIAS` | Android signing | Set during keytool generation |
| `KEY_PASSWORD` | Android signing | Set during keytool generation |
| `STORE_PASSWORD` | Android signing | Set during keytool generation |
| `IOS_CERTIFICATE_BASE64` | iOS code signing | Exported from Keychain Access |
| `IOS_CERTIFICATE_PASSWORD` | iOS code signing | Set during .p12 export |
| `IOS_PROVISIONING_PROFILE_BASE64` | iOS distribution | Downloaded from developer.apple.com |
| `IOS_KEYCHAIN_PASSWORD` | CI temporary keychain | Any random string |
