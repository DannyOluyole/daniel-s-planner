// lib/core/router/app_router.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../features/onboarding/presentation/screens/onboarding_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/block/presentation/screens/block_screen.dart';
import '../../features/community/presentation/screens/community_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../shell/main_shell.dart';
import '../providers/onboarding_provider.dart';

part 'app_router.g.dart';

// ─── Route name constants ─────────────────────────────────────────────────────

class Routes {
  Routes._();
  static const onboarding = '/onboarding';
  static const home       = '/home';
  static const block      = '/block';
  static const community  = '/community';
  static const profile    = '/profile';
}

// ─── Provider ────────────────────────────────────────────────────────────────

@riverpod
GoRouter appRouter(Ref ref) {
  final onboardingSeen = ref.watch(onboardingSeenProvider);

  return GoRouter(
    initialLocation: onboardingSeen ? Routes.home : Routes.onboarding,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final onShell = state.matchedLocation != Routes.onboarding;
      if (!onboardingSeen && onShell) return Routes.onboarding;
      if (onboardingSeen && state.matchedLocation == Routes.onboarding) {
        return Routes.home;
      }
      return null;
    },
    routes: [
      // ── Onboarding (outside shell, no tab bar) ──────────────────────────
      GoRoute(
        path: Routes.onboarding,
        name: 'onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),

      // ── Main shell (tab bar visible) ────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.home,
                name: 'home',
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.block,
                name: 'block',
                builder: (context, state) => const BlockScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.community,
                name: 'community',
                builder: (context, state) => const CommunityScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: Routes.profile,
                name: 'profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
