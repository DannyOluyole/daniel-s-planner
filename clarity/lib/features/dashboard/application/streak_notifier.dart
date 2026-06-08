// lib/features/dashboard/application/streak_notifier.dart
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/streak_repository.dart';
import '../data/firestore_repository.dart';
import '../domain/streak_model.dart';
import '../../auth/application/auth_provider.dart';

final streakRepositoryProvider = Provider<StreakRepository>((_) => StreakRepository());
final firestoreRepositoryProvider = Provider<FirestoreRepository>((_) => FirestoreRepository());

class StreakNotifier extends AsyncNotifier<StreakModel> {
  StreamSubscription<StreakModel>? _firestoreSub;

  StreakRepository    get _local => ref.read(streakRepositoryProvider);
  FirestoreRepository get _cloud => ref.read(firestoreRepositoryProvider);

  @override
  Future<StreakModel> build() async {
    final user = ref.watch(currentUserProvider);
    await _firestoreSub?.cancel();

    if (user != null) return _buildForSignedInUser(user.uid);

    final local = await _local.load();
    return _applyDayRollover(local);
  }

  Future<StreakModel> _buildForSignedInUser(String uid) async {
    final local = await _local.load();
    if (local.currentStreak > 0 || local.totalBlocksAllTime > 0) {
      await _cloud.migrateLocalStreak(uid, local);
      await _local.clear();
    }

    final initial = await _cloud.streakStream(uid).first;
    final rolled  = _applyDayRollover(initial);
    if (rolled.currentStreak != initial.currentStreak) {
      await _cloud.saveStreak(uid, rolled);
    }
    state = AsyncData(rolled);

    _firestoreSub = _cloud.streakStream(uid).listen(
      (model) => state = AsyncData(model),
      onError: (e) => state = AsyncError(e, StackTrace.current),
    );
    ref.onDispose(() => _firestoreSub?.cancel());
    return rolled;
  }

  Future<void> checkIn() async {
    final current = state.valueOrNull;
    if (current == null || current.checkedInToday) return;

    final now       = DateTime.now();
    final dayIndex  = (now.weekday - 1) % 7;
    final newStreak = current.currentStreak + 1;
    final best      = newStreak > current.bestStreak ? newStreak : current.bestStreak;
    final user      = ref.read(currentUserProvider);

    if (user != null) {
      await _cloud.checkIn(user.uid, newStreak: newStreak, bestStreak: best, dayIndex: dayIndex);
    } else {
      final w = List<double>.from(current.weeklyData)..[dayIndex] = 1.0;
      final updated = current.copyWith(
        currentStreak: newStreak, bestStreak: best,
        lastCheckInDate: now, weeklyData: w,
      );
      state = AsyncData(updated);
      await _local.save(updated);
    }
  }

  Future<void> recordBlock() async {
    final current = state.valueOrNull;
    if (current == null) return;
    final user = ref.read(currentUserProvider);

    if (user != null) {
      await _cloud.incrementBlocks(user.uid);
    } else {
      final now      = DateTime.now();
      final dayIndex = (now.weekday - 1) % 7;
      final w = List<double>.from(current.weeklyData)
        ..[dayIndex] = (current.weeklyData[dayIndex] + 0.1).clamp(0.0, 1.0);
      final updated = current.copyWith(totalBlocksAllTime: current.totalBlocksAllTime + 1, weeklyData: w);
      state = AsyncData(updated);
      await _local.save(updated);
    }
  }

  Future<void> seedDemoData() async {
    final demo = StreakModel(
      currentStreak: 14, bestStreak: 21, totalBlocksAllTime: 312,
      lastCheckInDate: DateTime.now(),
      weeklyData: [0.45, 0.80, 0.30, 0.65, 0.90, 0.55, 1.00],
    );
    final user = ref.read(currentUserProvider);
    if (user != null) {
      await _cloud.saveStreak(user.uid, demo);
    } else {
      state = AsyncData(demo);
      await _local.save(demo);
    }
  }

  StreakModel _applyDayRollover(StreakModel model) {
    final last = model.lastCheckInDate;
    if (last == null) return model;
    final now       = DateTime.now();
    final yesterday = DateTime(now.year, now.month, now.day - 1);
    final lastDay   = DateTime(last.year, last.month, last.day);
    if (lastDay.isBefore(yesterday)) return model.copyWith(currentStreak: 0);
    if (now.weekday == DateTime.monday && last.weekday != DateTime.monday) {
      return model.copyWith(weeklyData: List.filled(7, 0.0));
    }
    return model;
  }
}

final streakNotifierProvider =
    AsyncNotifierProvider<StreakNotifier, StreakModel>(StreakNotifier.new);

final currentStreakProvider  = Provider<int>((ref) => ref.watch(streakNotifierProvider).valueOrNull?.currentStreak      ?? 0);
final bestStreakProvider      = Provider<int>((ref) => ref.watch(streakNotifierProvider).valueOrNull?.bestStreak         ?? 0);
final weeklyDataProvider      = Provider<List<double>>((ref) => ref.watch(streakNotifierProvider).valueOrNull?.weeklyData ?? List.filled(7, 0.0));
final totalBlocksProvider     = Provider<int>((ref) => ref.watch(streakNotifierProvider).valueOrNull?.totalBlocksAllTime ?? 0);
