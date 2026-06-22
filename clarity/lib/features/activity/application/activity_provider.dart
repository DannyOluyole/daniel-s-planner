// lib/features/activity/application/activity_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/activity_repository.dart';
import '../domain/activity_metric.dart';

final activityRepositoryProvider = Provider<ActivityRepository>((ref) {
  return ActivityRepository();
});

final selectedMetricProvider =
    StateProvider<ActivityMetric>((ref) => ActivityMetric.screenTime);

final selectedDayProvider = StateProvider<DateTime>((ref) {
  final now = DateTime.now();
  return DateTime(now.year, now.month, now.day);
});

final activityBreakdownProvider =
    FutureProvider.autoDispose<List<AppActivityEntry>>((ref) async {
  final repo = ref.watch(activityRepositoryProvider);
  final metric = ref.watch(selectedMetricProvider);
  final day = ref.watch(selectedDayProvider);
  return repo.getBreakdown(metric, day);
});

final activityWeeklyTotalsProvider =
    FutureProvider.autoDispose<List<DailyTotal>>((ref) async {
  final repo = ref.watch(activityRepositoryProvider);
  final metric = ref.watch(selectedMetricProvider);
  return repo.getWeeklyTotals(metric);
});

final activityTotalTodayProvider = FutureProvider.autoDispose<int>((ref) async {
  final repo = ref.watch(activityRepositoryProvider);
  final metric = ref.watch(selectedMetricProvider);
  return repo.getTotalToday(metric);
});

// Screen-time minutes for today, independent of whatever metric the
// activity screen has selected — used for the dashboard's "Screen time" stat.
final screenTimeTodayMinutesProvider = FutureProvider.autoDispose<int>((ref) async {
  final repo = ref.watch(activityRepositoryProvider);
  return repo.getTotalToday(ActivityMetric.screenTime);
});
