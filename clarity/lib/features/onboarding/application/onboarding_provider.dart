// lib/features/onboarding/application/onboarding_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/onboarding_repository.dart';

// ─── Repository provider ─────────────────────────────────────────────────────

final onboardingRepositoryProvider = Provider<OnboardingRepository>(
  (_) => OnboardingRepository(),
);

// ─── Async provider — resolves true/false from SharedPreferences ──────────────

final onboardingCompleteProvider = FutureProvider<bool>((ref) async {
  final repo = ref.read(onboardingRepositoryProvider);
  return repo.isComplete();
});

// ─── Notifier — call markComplete() after the user taps "Get started" ─────────

class OnboardingNotifier extends AsyncNotifier<bool> {
  @override
  Future<bool> build() async {
    final repo = ref.read(onboardingRepositoryProvider);
    return repo.isComplete();
  }

  Future<void> markComplete() async {
    final repo = ref.read(onboardingRepositoryProvider);
    await repo.markComplete();
    state = const AsyncData(true);
  }
}

final onboardingNotifierProvider =
    AsyncNotifierProvider<OnboardingNotifier, bool>(OnboardingNotifier.new);
