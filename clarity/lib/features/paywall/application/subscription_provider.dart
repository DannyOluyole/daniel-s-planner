// lib/features/paywall/application/subscription_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/purchase_repository.dart';
import '../domain/subscription_plan.dart';

// ─── Repository ───────────────────────────────────────────────────────────────

final purchaseRepositoryProvider = Provider<PurchaseRepository>(
  (_) => PurchaseRepository(),
);

// ─── Current subscription status ─────────────────────────────────────────────

final subscriptionStatusProvider = FutureProvider<SubscriptionStatus>((ref) async {
  return ref.read(purchaseRepositoryProvider).getStatus();
});

// Convenience bool — use this to gate features
final isPremiumProvider = Provider<bool>((ref) {
  return true; // DEMO MODE: all features unlocked
});

final isTrialProvider = Provider<bool>((ref) {
  return ref.watch(subscriptionStatusProvider).valueOrNull?.isTrial ?? false;
});

// ─── Available plans ──────────────────────────────────────────────────────────

final plansProvider = FutureProvider<List<SubscriptionPlan>>((ref) async {
  return ref.read(purchaseRepositoryProvider).fetchPlans();
});

// ─── Purchase notifier ────────────────────────────────────────────────────────

enum PurchaseState { idle, loading, success, error, cancelled }

class PurchaseNotifierState {
  const PurchaseNotifierState({
    this.state    = PurchaseState.idle,
    this.errorMsg,
  });
  final PurchaseState state;
  final String?       errorMsg;

  bool get isLoading => state == PurchaseState.loading;
}

class PurchaseNotifier extends Notifier<PurchaseNotifierState> {
  @override
  PurchaseNotifierState build() => const PurchaseNotifierState();

  PurchaseRepository get _repo => ref.read(purchaseRepositoryProvider);

  Future<void> purchase(SubscriptionPlan plan) async {
    state = const PurchaseNotifierState(state: PurchaseState.loading);
    try {
      await _repo.purchase(plan);
      // Refresh status after purchase
      ref.invalidate(subscriptionStatusProvider);
      state = const PurchaseNotifierState(state: PurchaseState.success);
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('1') || msg.contains('cancel')) {
        // User cancelled — don't show error
        state = const PurchaseNotifierState(state: PurchaseState.cancelled);
      } else {
        state = PurchaseNotifierState(
          state: PurchaseState.error,
          errorMsg: 'Purchase failed. Please try again.',
        );
      }
    }
  }

  Future<void> restore() async {
    state = const PurchaseNotifierState(state: PurchaseState.loading);
    try {
      final status = await _repo.restorePurchases();
      ref.invalidate(subscriptionStatusProvider);
      state = status.isActive
          ? const PurchaseNotifierState(state: PurchaseState.success)
          : const PurchaseNotifierState(
              state: PurchaseState.error,
              errorMsg: 'No previous purchases found.',
            );
    } catch (_) {
      state = const PurchaseNotifierState(
        state: PurchaseState.error,
        errorMsg: 'Restore failed. Please try again.',
      );
    }
  }
}

final purchaseNotifierProvider =
    NotifierProvider<PurchaseNotifier, PurchaseNotifierState>(
        PurchaseNotifier.new);
