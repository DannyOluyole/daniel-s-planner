class TimeRule {
  const TimeRule({
    required this.id,
    required this.name,
    required this.startMinutes,
    required this.endMinutes,
    required this.days,
    required this.packageNames,
    required this.appNames,
  });

  final String       id;
  final String       name;
  final int          startMinutes; // minutes since midnight, 0-1439
  final int          endMinutes;   // minutes since midnight, 0-1439 (may be < start = crosses midnight)
  final List<bool>   days;         // 7 entries, Mon..Sun
  final List<String> packageNames; // packages blocked during this window
  final List<String> appNames;     // display names (parallel to packageNames)

  TimeRule copyWith({
    String? name,
    int? startMinutes,
    int? endMinutes,
    List<bool>? days,
    List<String>? packageNames,
    List<String>? appNames,
  }) =>
      TimeRule(
        id:           id,
        name:         name         ?? this.name,
        startMinutes: startMinutes ?? this.startMinutes,
        endMinutes:   endMinutes   ?? this.endMinutes,
        days:         days         ?? this.days,
        packageNames: packageNames ?? this.packageNames,
        appNames:     appNames     ?? this.appNames,
      );

  Map<String, dynamic> toJson() => {
    'id':      id,
    'name':    name,
    'start':   startMinutes,
    'end':     endMinutes,
    'days':    days,
    'packages': packageNames,
    'appNames': appNames,
  };

  factory TimeRule.fromJson(Map<String, dynamic> j) => TimeRule(
    id:           j['id']   as String,
    name:         j['name'] as String,
    startMinutes: (j['start'] as num).toInt(),
    endMinutes:   (j['end']   as num).toInt(),
    days:         (j['days'] as List).map((d) => d as bool).toList(),
    packageNames: (j['packages'] as List).cast<String>(),
    appNames:     (j['appNames'] as List? ?? []).cast<String>(),
  );

  static String _fmt(int minutes) {
    final h24 = minutes ~/ 60;
    final m   = minutes % 60;
    final h12 = h24 % 12 == 0 ? 12 : h24 % 12;
    final ampm = h24 < 12 ? 'AM' : 'PM';
    return '${h12.toString()}:${m.toString().padLeft(2, '0')} $ampm';
  }

  String get timeRangeLabel => '${_fmt(startMinutes)} – ${_fmt(endMinutes)}';

  static const _dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  String get daysLabel {
    if (days.every((d) => d)) return 'Every day';
    if (days[0] && days[1] && days[2] && days[3] && days[4] && !days[5] && !days[6]) {
      return 'Weekdays';
    }
    if (!days[0] && !days[1] && !days[2] && !days[3] && !days[4] && days[5] && days[6]) {
      return 'Weekends';
    }
    final picked = <String>[];
    for (var i = 0; i < 7; i++) {
      if (days[i]) picked.add(_dayLetters[i]);
    }
    return picked.join(' ');
  }

  /// Whether [nowMinutes] (minutes since midnight, 0-1439) on [weekdayIndex]
  /// (0=Mon..6=Sun) falls inside this rule's active window.
  bool isActiveAt(int weekdayIndex, int nowMinutes) {
    if (!days[weekdayIndex]) return false;
    if (startMinutes <= endMinutes) {
      return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    }
    // Crosses midnight, e.g. 22:00 - 07:00
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }
}
