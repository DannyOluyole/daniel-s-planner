# Clarity — Flutter Project

Screen-time blocking & habit recovery app.

## Project structure

```
lib/
├── main.dart                          # Entry point
├── core/
│   ├── theme/app_theme.dart           # All colour tokens + ThemeData
│   ├── router/app_router.dart         # go_router config (+ .g.dart stub)
│   └── shell/main_shell.dart          # Bottom tab bar shell
└── features/
    ├── onboarding/presentation/screens/onboarding_screen.dart
    ├── dashboard/presentation/screens/dashboard_screen.dart
    ├── block/presentation/screens/block_screen.dart
    ├── community/presentation/screens/community_screen.dart
    └── profile/presentation/screens/profile_screen.dart
```

## Setup

### 1. Install dependencies

```bash
flutter pub get
```

### 2. Run on emulator / device

```bash
flutter run
```

### 3. (Optional) Regenerate Riverpod code-gen

The `app_router.g.dart` file is hand-written for now.
When you add more `@riverpod` providers, regenerate with:

```bash
dart run build_runner build --delete-conflicting-outputs
```

## Packages used

| Package | Purpose |
|---|---|
| `go_router` | Navigation / deep linking |
| `flutter_riverpod` + `riverpod_annotation` | State management |
| `google_fonts` | Inter font |
| `flutter_tabler_icons` | Tabler icon set (matches prototype) |
| `shared_preferences` | Local persistence (Phase 3+) |

## Colour system

All design tokens live in `ClarityColors` in `app_theme.dart`.
Nothing is hard-coded elsewhere — change a token once, it updates everywhere.

## Next steps (Phase 3 — Screens & UI)

The five screens are scaffolded with real UI matching the prototype.
What's still stubbed:

- [ ] Onboarding: persist "seen" state so it only shows once (SharedPreferences)
- [ ] Dashboard: wire week chart to real data model
- [ ] Block: integrate with Android `UsageStatsManager` / iOS Screen Time API
- [ ] Community: replace static posts with Firestore listener
- [ ] Profile: read streak + stats from Firestore (Phase 4)

## Phase 4 additions

- Firebase Auth (`firebase_auth`, `google_sign_in`)
- Cloud Firestore for user data
- Firebase Cloud Messaging for daily reminders

## Phase 5 additions

- RevenueCat SDK (`purchases_flutter`)
- Products in App Store Connect + Google Play Console
- 7-day free trial config
- Feature gating for strict mode / community SOS
