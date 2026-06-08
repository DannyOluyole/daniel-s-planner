// lib/features/dashboard/application/streak_notifier.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/streak_repository.dart';
import '../domain/streak_model.dart';

// ─── Repository provider ─────────────────────────────────────────────────────

final streakRepositoryProvider = Provider<StreakRepository>(
  (_) => StreakRepository(),
);

// ─── Notifier ────────────────────────────────────────────────────────────────

class StreakNotifier extends AsyncNotifier<StreakModel> {
  StreakRepository get _repo => ref.read(streakRepositoryProvider);

  @override
  Future<StreakModel> build() async {
    final model = await _repo.load();
    return _applyDayRollover(model);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Call when the user taps "Check in" on the dashboard.
  Future<void> checkIn() async {
    final current = state.valueOrNull;
    if (current == null) return;
    if (current.checkedInToday) return; // already done today

    final now     = DateTime.now();
    final dayIndex = (now.weekday - 1) % 7; // Mon=0 … Sun=6

    // Update weekly bar for today (cap at 1.0)
    final newWeekly = List<double>.from(current.weeklyData);
    newWeekly[dayIndex] = 1.0;

    final newStreak = current.currentStreak + 1;
    final updated   = current.copyWith(
      currentStreak:   newStreak,
      bestStreak:      newStreak > current.bestStreak ? newStreak : current.bestStreak,
      lastCheckInDate: now,
      weeklyData:      newWeekly,
    );

    state = AsyncData(updated);
    await _repo.save(updated);
  }

  /// Call every time the blocking layer fires (Phase 4: from Firestore write).
  Future<void> recordBlock() async {
    final current = state.valueOrNull;
    if (current == null) return;

    final now      = DateTime.now();
    final dayIndex = (now.weekday - 1) % 7;

    final newWeekly = List<double>.from(current.weeklyData);
    // Increment today's bar by 0.1 per block, max 1.0
    newWeekly[dayIndex] = (newWeekly[dayIndex] + 0.1).clamp(0.0, 1.0);

    final updated = current.copyWith(
      totalBlocksAllTime: current.totalBlocksAllTime + 1,
      weeklyData:         newWeekly,
    );

    state = AsyncData(updated);
    await _repo.save(updated);
  }

  /// Seed with realistic demo data (useful for screenshots / first launch).
  Future<void> seedDemoData() async {
    final demo = StreakModel(
      currentStreak:      14,
      bestStreak:         21,
      totalBlocksAllTime: 312,
      lastCheckInDate:    DateTime.now(),
      weeklyData:         [0.45, 0.80, 0.30, 0.65, 0.90, 0.55, 1.00],
    );
    state = AsyncData(demo);
    await _repo.save(demo);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /// If the user missed yesterday (or more), break the streak.
  StreakModel _applyDayRollover(StreakModel model) {
    final last = model.lastCheckInDate;
    if (last == null) return model;

    final now       = DateTime.now();
    final yesterday = DateTime(now.year, now.month, now.day - 1);
    final lastDay   = DateTime(last.year, last.month, last.day);

    // If last check-in was before yesterday → streak broken
    if (lastDay.isBefore(yesterday)) {
      final reset = model.copyWith(currentStreak: 0);
      _repo.save(reset); // fire-and-forget
      return reset;
    }

    // On a new week (Monday), reset the weekly bars
    if (now.weekday == DateTime.monday && last.weekday != DateTime.monday) {
      final reset = model.copyWith(weeklyData: List.filled(7, 0.0));
      _repo.save(reset);
      return reset;
    }

    return model;
  }
}

final streakNotifierProvider =
    AsyncNotifierProvider<StreakNotifier, StreakModel>(StreakNotifier.new);

// ─── Convenience selectors (avoid rebuilding whole tree) ─────────────────────

final currentStreakProvider = Provider<int>((ref) {
  return ref.watch(streakNotifierProvider).valueOrNull?.currentStreak ?? 0;
});

final bestStreakProvider = Provider<int>((ref) {
  return ref.watch(streakNotifierProvider).valueOrNull?.bestStreak ?? 0;
});

final weeklyDataProvider = Provider<List<double>>((ref) {
  return ref.watch(streakNotifierProvider).valueOrNull?.weeklyData ??
      List.filled(7, 0.0);
});

final totalBlocksProvider = Provider<int>((ref) {
  return ref.watch(streakNotifierProvider).valueOrNull?.totalBlocksAllTime ?? 0;
});
