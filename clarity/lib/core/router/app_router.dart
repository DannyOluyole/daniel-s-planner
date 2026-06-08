// lib/core/router/app_router.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
  static const onboarding = '/onboarding';
  static const home       = '/home';
  static const block      = '/block';
  static const community  = '/community';
  static const profile    = '/profile';
}

GoRouter buildRouter(bool onboardingComplete) {
  return GoRouter(
    initialLocation: onboardingComplete ? Routes.home : Routes.onboarding,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      // If user somehow navigates to onboarding after completing it, push to home
      if (onboardingComplete && state.matchedLocation == Routes.onboarding) {
        return Routes.home;
      }
      return null;
    },
    routes: [
      GoRoute(
        path: Routes.onboarding,
        name: 'onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: Routes.home,      name: 'home',      builder: (_, __) => const DashboardScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: Routes.block,     name: 'block',     builder: (_, __) => const BlockScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: Routes.community, name: 'community', builder: (_, __) => const CommunityScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: Routes.profile,   name: 'profile',   builder: (_, __) => const ProfileScreen()),
          ]),
        ],
      ),
    ],
  );
}

// Provider — re-reads whenever onboarding state changes
final appRouterProvider = Provider<GoRouter>((ref) {
  final onboardingAsync = ref.watch(onboardingNotifierProvider);
  final complete = onboardingAsync.valueOrNull ?? false;
  return buildRouter(complete);
});
