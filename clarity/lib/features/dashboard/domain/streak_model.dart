// lib/features/dashboard/domain/streak_model.dart

class StreakModel {
  const StreakModel({
    required this.currentStreak,
    required this.bestStreak,
    required this.totalBlocksAllTime,
    required this.lastCheckInDate,
    required this.weeklyData, // 7 values 0.0–1.0, index 0 = Mon
  });

  final int          currentStreak;
  final int          bestStreak;
  final int          totalBlocksAllTime;
  final DateTime?    lastCheckInDate;
  final List<double> weeklyData;

  /// True if the user has already checked in today
  bool get checkedInToday {
    if (lastCheckInDate == null) return false;
    final now   = DateTime.now();
    final last  = lastCheckInDate!;
    return last.year == now.year &&
           last.month == now.month &&
           last.day   == now.day;
  }

  StreakModel copyWith({
    int?          currentStreak,
    int?          bestStreak,
    int?          totalBlocksAllTime,
    DateTime?     lastCheckInDate,
    List<double>? weeklyData,
  }) {
    return StreakModel(
      currentStreak:      currentStreak      ?? this.currentStreak,
      bestStreak:         bestStreak         ?? this.bestStreak,
      totalBlocksAllTime: totalBlocksAllTime ?? this.totalBlocksAllTime,
      lastCheckInDate:    lastCheckInDate    ?? this.lastCheckInDate,
      weeklyData:         weeklyData         ?? this.weeklyData,
    );
  }

  /// Serialise to a flat map for SharedPreferences
  Map<String, dynamic> toJson() => {
    'currentStreak':      currentStreak,
    'bestStreak':         bestStreak,
    'totalBlocksAllTime': totalBlocksAllTime,
    'lastCheckInDate':    lastCheckInDate?.toIso8601String(),
    'weeklyData':         weeklyData,
  };

  factory StreakModel.fromJson(Map<String, dynamic> json) => StreakModel(
    currentStreak:      (json['currentStreak']      as int?)    ?? 0,
    bestStreak:         (json['bestStreak']         as int?)    ?? 0,
    totalBlocksAllTime: (json['totalBlocksAllTime'] as int?)    ?? 0,
    lastCheckInDate:    json['lastCheckInDate'] != null
        ? DateTime.tryParse(json['lastCheckInDate'] as String)
        : null,
    weeklyData: (json['weeklyData'] as List<dynamic>?)
            ?.map((e) => (e as num).toDouble())
            .toList() ??
        List.filled(7, 0.0),
  );

  static StreakModel get empty => StreakModel(
    currentStreak:      0,
    bestStreak:         0,
    totalBlocksAllTime: 0,
    lastCheckInDate:    null,
    weeklyData:         List.filled(7, 0.0),
  );
}
