import 'package:flutter_riverpod/flutter_riverpod.dart';

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
  final List<bool>     activeDays; // Mon–Sun
  final int            strictness; // 0=Soft 1=Standard 2=Strict

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
}

class BlockSettingsNotifier extends StateNotifier<BlockSettings> {
  BlockSettingsNotifier()
      : super(const BlockSettings(
          apps: [
            AppEntry(emoji: '📱', name: 'TikTok',     category: 'Short video', blocked: true),
            AppEntry(emoji: '📸', name: 'Instagram',  category: 'Social',      blocked: true),
            AppEntry(emoji: '👽', name: 'Reddit',     category: 'Forums',      blocked: false),
            AppEntry(emoji: '🐦', name: 'X / Twitter',category: 'Social',      blocked: false),
          ],
          keywords:      ['porn', 'explicit', 'nsfw'],
          scheduleStart: '10:00 PM',
          scheduleEnd:   '7:00 AM',
          activeDays:    [true, true, true, true, true, false, false],
          strictness:    1,
        ));

  void toggleApp(int index) {
    final updated = List<AppEntry>.from(state.apps);
    updated[index] = updated[index].copyWith(blocked: !updated[index].blocked);
    state = state.copyWith(apps: updated);
  }

  void addKeyword(String word) {
    if (word.trim().isEmpty) return;
    state = state.copyWith(keywords: [...state.keywords, word.trim()]);
  }

  void removeKeyword(int index) {
    final updated = List<String>.from(state.keywords)..removeAt(index);
    state = state.copyWith(keywords: updated);
  }

  void toggleDay(int index) {
    final updated = List<bool>.from(state.activeDays);
    updated[index] = !updated[index];
    state = state.copyWith(activeDays: updated);
  }

  void setStrictness(int value) => state = state.copyWith(strictness: value);
}

final blockSettingsProvider =
    StateNotifierProvider<BlockSettingsNotifier, BlockSettings>(
        (_) => BlockSettingsNotifier());
