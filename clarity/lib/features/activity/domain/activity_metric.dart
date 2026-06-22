// lib/features/activity/domain/activity_metric.dart

enum ActivityMetric { screenTime, notifications, opens }

extension ActivityMetricX on ActivityMetric {
  String get label => switch (this) {
        ActivityMetric.screenTime => 'Screen time',
        ActivityMetric.notifications => 'Notifications received',
        ActivityMetric.opens => 'Times opened',
      };

  String get nativeKey => switch (this) {
        ActivityMetric.screenTime => 'screenTime',
        ActivityMetric.notifications => 'notifications',
        ActivityMetric.opens => 'opens',
      };

  String get unit => switch (this) {
        ActivityMetric.screenTime => '',
        ActivityMetric.notifications => 'notifications',
        ActivityMetric.opens => 'unlocks',
      };
}

class AppActivityEntry {
  const AppActivityEntry({
    required this.packageName,
    required this.appName,
    required this.value,
  });

  final String packageName;
  final String appName;
  final int value;

  factory AppActivityEntry.fromJson(Map<String, dynamic> json, String valueKey) {
    return AppActivityEntry(
      packageName: json['packageName'] as String,
      appName: json['appName'] as String,
      value: (json[valueKey] as num).toInt(),
    );
  }
}

class DailyTotal {
  const DailyTotal({required this.date, required this.value});

  final DateTime date;
  final int value;

  factory DailyTotal.fromJson(Map<String, dynamic> json) {
    return DailyTotal(
      date: DateTime.fromMillisecondsSinceEpoch(json['dateMillis'] as int),
      value: (json['value'] as num).toInt(),
    );
  }
}
