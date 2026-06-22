// lib/core/router/app_router.dart
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_provider.dart';
import '../../features/auth/presentation/screens/sign_in_screen.dart';
import '../../features/paywall/presentation/screens/paywall_screen.dart';
import '../../features/auth/presentation/screens/sign_up_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/onboarding/application/onboarding_provider.dart';
import '../../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../../features/permissions/presentation/screens/permissions_screen.dart';
import '../../features/permissions/application/permissions_provider.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/block/presentation/screens/block_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/activity/presentation/screens/app_activity_screen.dart';
import '../shell/main_shell.dart';

part 'app_router.g.dart';

class Routes {
  Routes._();
  static const onboarding    = '/onboarding';
  static const signIn        = '/sign-in';
  static const signUp        = '/sign-up';
  static const forgotPassword = '/forgot-password';
  static const paywall        = '/paywall';
  static const permissions   = '/permissions';
  static const home          = '/home';
  static const block         = '/block';
  static const profile       = '/profile';
  static const appActivity   = '/app-activity';
}

// Routes reachable without being signed in
const _authRoutes = {
  Routes.signIn,
  Routes.signUp,
  Routes.forgotPassword,
};

// Notifies GoRouter whenever auth or onboarding state changes, so it
// re-evaluates `redirect` without rebuilding the router itself.
class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(Ref ref) {
    ref.listen(authStateProvider, (_, __) => notifyListeners());
    ref.listen(onboardingNotifierProvider, (_, __) => notifyListeners());
    ref.listen(permissionsProvider, (_, __) => notifyListeners());
  }
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefreshNotifier(ref);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: Routes.onboarding,
    debugLogDiagnostics: true,
    refreshListenable: refresh,
    redirect: (context, state) {
      final authAsync       = ref.read(authStateProvider);
      final onboardingAsync = ref.read(onboardingNotifierProvider);

      // Wait for the first auth/onboarding snapshot before deciding anything.
      if (!authAsync.hasValue || !onboardingAsync.hasValue) return null;

      final isSignedIn     = authAsync.value != null;
      final onboardingDone = onboardingAsync.value ?? false;
      final path           = state.matchedLocation;

      if (!onboardingDone) {
        return path == Routes.onboarding ? null : Routes.onboarding;
      }

      if (!isSignedIn) {
        return _authRoutes.contains(path) ? null : Routes.signIn;
      }

      // Signed in and onboarded — keep users away from onboarding/auth screens.
      if (path == Routes.onboarding || _authRoutes.contains(path)) {
        return Routes.home;
      }

      // Force the permissions screen until all 3 blocking permissions are
      // granted, so blocking/screen-time actually work instead of silently
      // doing nothing. Respect an explicit "Skip for now" for this session.
      final perms   = ref.read(permissionsProvider);
      final skipped = ref.read(permissionsSkippedProvider);
      if (!perms.isChecking && !perms.allGranted && !skipped &&
          path != Routes.permissions) {
        return Routes.permissions;
      }

      return null;
    },
    routes: [
      // ── Public ──────────────────────────────────────────────────────────
      GoRoute(path: Routes.onboarding,
          builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: Routes.signIn,
          builder: (_, __) => const SignInScreen()),
      GoRoute(path: Routes.signUp,
          builder: (_, __) => const SignUpScreen()),
      GoRoute(path: Routes.forgotPassword,
          builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(path: Routes.paywall,
          builder: (_, __) => const PaywallScreen(isDismissible: false)),
      GoRoute(path: Routes.permissions,
          builder: (_, __) => const PermissionsScreen()),
      GoRoute(path: Routes.appActivity,
          builder: (_, __) => const AppActivityScreen()),

      // ── Protected shell ──────────────────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => MainShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: Routes.home,
                builder: (_, __) => const DashboardScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: Routes.block,
                builder: (_, __) => const BlockScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: Routes.profile,
                builder: (_, __) => const ProfileScreen()),
          ]),
        ],
      ),
    ],
  );
});
