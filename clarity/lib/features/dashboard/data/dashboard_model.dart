import 'package:flutter_riverpod/flutter_riverpod.dart';

class DayUsage {
  const DayUsage({required this.label, required this.fraction, required this.isToday});
  final String label;
  final double fraction; // 0.0–1.0 relative to max in week
  final bool   isToday;
}

class DashboardStats {
  const DashboardStats({
    required this.streakDays,
    required this.bestStreak,
    required this.screenTimeToday,
    required this.urgesBlocked,
    required this.screenTimeDelta,
    required this.urgesDelta,
    required this.weekData,
    required this.aiNudge,
    required this.userName,
    required this.userInitials,
  });

  final int    streakDays;
  final int    bestStreak;
  final String screenTimeToday;
  final int    urgesBlocked;
  final String screenTimeDelta;
  final String urgesDelta;
  final List<DayUsage> weekData;
  final String aiNudge;
  final String userName;
  final String userInitials;
}

class DashboardNotifier extends StateNotifier<DashboardStats> {
  DashboardNotifier()
      : super(const DashboardStats(
          streakDays: 14,
          bestStreak: 21,
          screenTimeToday: '2h 14m',
          urgesBlocked: 18,
          screenTimeDelta: '↓ 45 min',
          urgesDelta: '↑ 3 today',
          aiNudge:
              "14 days. You've blocked 18 urges this week — that's real progress. Keep going.",
          userName: 'Danny',
          userInitials: 'DK',
          weekData: [
            DayUsage(label: 'M', fraction: 0.45, isToday: false),
            DayUsage(label: 'T', fraction: 0.80, isToday: false),
            DayUsage(label: 'W', fraction: 0.30, isToday: false),
            DayUsage(label: 'T', fraction: 0.65, isToday: false),
            DayUsage(label: 'F', fraction: 0.90, isToday: false),
            DayUsage(label: 'S', fraction: 0.55, isToday: false),
            DayUsage(label: 'S', fraction: 1.00, isToday: true),
          ],
        ));
}

final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardStats>(
        (_) => DashboardNotifier());
