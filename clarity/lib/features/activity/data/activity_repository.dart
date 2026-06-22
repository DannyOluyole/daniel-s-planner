// lib/features/activity/data/activity_repository.dart
import '../../block/platform/blocking_channel.dart';
import '../domain/activity_metric.dart';

class ActivityRepository {
  Future<bool> hasPermission(ActivityMetric metric) {
    return switch (metric) {
      ActivityMetric.notifications => BlockingChannel.hasNotificationPermission(),
      _ => BlockingChannel.hasUsagePermission(),
    };
  }

  Future<void> requestPermission(ActivityMetric metric) {
    return switch (metric) {
      ActivityMetric.notifications => BlockingChannel.requestNotificationPermission(),
      _ => BlockingChannel.requestUsagePermission(),
    };
  }

  /// Returns per-app breakdown for [day] (defaults to today), sorted descending.
  Future<List<AppActivityEntry>> getBreakdown(
    ActivityMetric metric,
    DateTime day,
  ) async {
    final dayStart = DateTime(day.year, day.month, day.day).millisecondsSinceEpoch;
    final dayEnd = dayStart + const Duration(days: 1).inMilliseconds;

    switch (metric) {
      case ActivityMetric.screenTime:
        final raw = await BlockingChannel.getTodayUsage();
        return raw.map((e) => AppActivityEntry.fromJson(e, 'minutesUsed')).toList();
      case ActivityMetric.opens:
        final raw = await BlockingChannel.getAppOpens(dayStart: dayStart, dayEnd: dayEnd);
        return raw.map((e) => AppActivityEntry.fromJson(e, 'opens')).toList();
      case ActivityMetric.notifications:
        final raw = await BlockingChannel.getNotificationsForDay(dayStart: dayStart);
        return raw.map((e) => AppActivityEntry.fromJson(e, 'notifications')).toList();
    }
  }

  /// Returns 7 days of totals, oldest first, today last.
  Future<List<DailyTotal>> getWeeklyTotals(ActivityMetric metric) async {
    final raw = await BlockingChannel.getWeeklyTotals(metric.nativeKey);
    return raw.map(DailyTotal.fromJson).toList();
  }

  Future<int> getTotalToday(ActivityMetric metric) async {
    switch (metric) {
      case ActivityMetric.screenTime:
        return BlockingChannel.getTotalMinutesToday();
      case ActivityMetric.opens:
      case ActivityMetric.notifications:
        final breakdown = await getBreakdown(metric, DateTime.now());
        return breakdown.fold<int>(0, (sum, e) => sum + e.value);
    }
  }
}
