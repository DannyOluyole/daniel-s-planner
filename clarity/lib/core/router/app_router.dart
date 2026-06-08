// lib/core/router/app_router.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_provider.dart';
import '../../features/auth/presentation/screens/sign_in_screen.dart';
import '../../features/paywall/presentation/screens/paywall_screen.dart';
import '../../features/auth/presentation/screens/sign_up_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/onboarding/application/onboarding_provider.dart';
import '../../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/block/presentation/screens/block_screen.dart';
import '../../features/community/presentation/screens/community_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../shell/main_shell.dart';

part 'app_router.g.dart';

class Routes {
  Routes._();
  static const onboarding    = '/onboarding';
  static const signIn        = '/sign-in';
  static const signUp        = '/sign-up';
  static const forgotPassword = '/forgot-password';
  static const paywall        = '/paywall';
  static const home          = '/home';
  static const block         = '/block';
  static const community     = '/community';
  static const profile       = '/profile';
}

// Routes that don't require auth
const _publicRoutes = {
  Routes.onboarding,
  Routes.signIn,
  Routes.signUp,
  Routes.forgotPassword,
  Routes.paywall,
};

final appRouterProvider = Provider<GoRouter>((ref) {
  final authAsync        = ref.watch(authStateProvider);
  final onboardingAsync  = ref.watch(onboardingNotifierProvider);

  return GoRouter(
    initialLocation: Routes.onboarding,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isPublic        = _publicRoutes.contains(state.matchedLocation);
      final onboardingDone  = onboardingAsync.valueOrNull ?? false;
      final isSignedIn      = authAsync.valueOrNull != null;
      // Still loading — don't redirect yet
      if (authAsync.isLoading || onboardingAsync.isLoading) return null;

      // Not seen onboarding yet
      if (!onboardingDone) {
        return isPublic ? null : Routes.onboarding;
      }

      // Onboarding done but not signed in → send to sign-in
      if (!isSignedIn && !isPublic) return Routes.signIn;

      // Signed in but still on auth screens → send home
      if (isSignedIn && isPublic) return Routes.home;

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
            GoRoute(path: Routes.community,
                builder: (_, __) => const CommunityScreen()),
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
