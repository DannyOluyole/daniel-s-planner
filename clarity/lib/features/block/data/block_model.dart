// lib/features/block/data/block_model.dart

class AppEntry {
  const AppEntry({
    required this.emoji,
    required this.name,
    required this.category,
    required this.blocked,
  });

  final String emoji;
  final String name;
  final String category;
  final bool   blocked;

  AppEntry copyWith({bool? blocked}) =>
      AppEntry(emoji: emoji, name: name, category: category, blocked: blocked ?? this.blocked);

  Map<String, dynamic> toJson() => {
    'emoji': emoji, 'name': name, 'category': category, 'blocked': blocked,
  };

  factory AppEntry.fromJson(Map<String, dynamic> j) => AppEntry(
    emoji:    j['emoji']    as String,
    name:     j['name']     as String,
    category: j['category'] as String,
    blocked:  j['blocked']  as bool,
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
    apps: [
      AppEntry(emoji: '📱', name: 'TikTok',      category: 'Short video', blocked: true),
      AppEntry(emoji: '📸', name: 'Instagram',   category: 'Social',      blocked: true),
      AppEntry(emoji: '👽', name: 'Reddit',      category: 'Forums',      blocked: false),
      AppEntry(emoji: '🐦', name: 'X / Twitter', category: 'Social',      blocked: false),
    ],
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
