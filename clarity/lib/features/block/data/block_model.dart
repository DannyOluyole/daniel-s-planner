// lib/features/block/data/block_model.dart

class AppEntry {
  const AppEntry({
    required this.emoji,
    required this.name,
    required this.category,
    required this.blocked,
    this.packageName,
    this.openLimitPerDay,
    this.timeLimitMinutes,
  });

  final String  emoji;
  final String  name;
  final String  category;
  final bool    blocked;
  final String? packageName;      // Android package id, e.g. "com.zhiliaoapp.musically"
  final int?    openLimitPerDay;  // null = no open-count limit
  final int?    timeLimitMinutes; // null = no daily time limit

  AppEntry copyWith({
    bool?  blocked,
    int?   openLimitPerDay,
    int?   timeLimitMinutes,
    bool   clearOpenLimit = false,
    bool   clearTimeLimit = false,
  }) => AppEntry(
    emoji: emoji, name: name, category: category,
    blocked: blocked ?? this.blocked, packageName: packageName,
    openLimitPerDay: clearOpenLimit ? null : (openLimitPerDay ?? this.openLimitPerDay),
    timeLimitMinutes: clearTimeLimit ? null : (timeLimitMinutes ?? this.timeLimitMinutes),
  );

  Map<String, dynamic> toJson() => {
    'emoji': emoji, 'name': name, 'category': category,
    'blocked': blocked, 'packageName': packageName,
    'openLimitPerDay': openLimitPerDay, 'timeLimitMinutes': timeLimitMinutes,
  };

  factory AppEntry.fromJson(Map<String, dynamic> j) => AppEntry(
    emoji:            j['emoji']            as String,
    name:             j['name']             as String,
    category:         j['category']         as String,
    blocked:          j['blocked']          as bool,
    packageName:      j['packageName']      as String?,
    openLimitPerDay:  j['openLimitPerDay']  as int?,
    timeLimitMinutes: j['timeLimitMinutes'] as int?,
  );
}

class BlockSettings {
  const BlockSettings({
    required this.apps,
    required this.keywords,
    required this.scheduleStart,
    required this.scheduleEnd,
    required this.activeDays,
    required this.strictness,
  });

  final List<AppEntry> apps;
  final List<String>   keywords;
  final String         scheduleStart;
  final String         scheduleEnd;
  final List<bool>     activeDays;
  final int            strictness; // 0=Soft 1=Standard 2=Strict

  static const defaultSettings = BlockSettings(
    apps: [],
    keywords:      ['porn', 'explicit', 'nsfw'],
    scheduleStart: '10:00 PM',
    scheduleEnd:   '7:00 AM',
    activeDays:    [true, true, true, true, true, false, false],
    strictness:    1,
  );

  BlockSettings copyWith({
    List<AppEntry>? apps,
    List<String>?   keywords,
    String?         scheduleStart,
    String?         scheduleEnd,
    List<bool>?     activeDays,
    int?            strictness,
  }) =>
      BlockSettings(
        apps:          apps          ?? this.apps,
        keywords:      keywords      ?? this.keywords,
        scheduleStart: scheduleStart ?? this.scheduleStart,
        scheduleEnd:   scheduleEnd   ?? this.scheduleEnd,
        activeDays:    activeDays    ?? this.activeDays,
        strictness:    strictness    ?? this.strictness,
      );

  Map<String, dynamic> toJson() => {
    'apps':          apps.map((a) => a.toJson()).toList(),
    'keywords':      keywords,
    'scheduleStart': scheduleStart,
    'scheduleEnd':   scheduleEnd,
    'activeDays':    activeDays,
    'strictness':    strictness,
  };

  factory BlockSettings.fromJson(Map<String, dynamic> j) => BlockSettings(
    apps:          (j['apps'] as List).map((e) => AppEntry.fromJson(e as Map<String, dynamic>)).toList(),
    keywords:      List<String>.from(j['keywords'] as List),
    scheduleStart: j['scheduleStart'] as String,
    scheduleEnd:   j['scheduleEnd']   as String,
    activeDays:    List<bool>.from(j['activeDays'] as List),
    strictness:    j['strictness']    as int,
  );
}
