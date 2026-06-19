// lib/features/block/application/block_settings_notifier.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/block_model.dart';
import '../data/block_repository.dart';
import '../platform/blocking_channel.dart';

final blockRepositoryProvider = Provider<BlockRepository>((_) => BlockRepository());

class BlockSettingsNotifier extends AsyncNotifier<BlockSettings> {
  BlockRepository get _repo => ref.read(blockRepositoryProvider);

  @override
  Future<BlockSettings> build() => _repo.load();

  Future<void> addApp({
    required String name,
    required String emoji,
    required String category,
    String? packageName,
  }) =>
      _mutate((s) {
        if (packageName != null &&
            s.apps.any((a) => a.packageName == packageName)) {
          return s;
        }
        final apps = List<AppEntry>.from(s.apps)
          ..add(AppEntry(
            emoji: emoji,
            name: name,
            category: category,
            blocked: true,
            packageName: packageName,
          ));
        return s.copyWith(apps: apps);
      });

  Future<void> removeApp(int index) => _mutate((s) {
    final apps = List<AppEntry>.from(s.apps)..removeAt(index);
    return s.copyWith(apps: apps);
  });

  Future<void> toggleApp(int index) => _mutate((s) {
    final apps = List<AppEntry>.from(s.apps);
    apps[index] = apps[index].copyWith(blocked: !apps[index].blocked);
    return s.copyWith(apps: apps);
  });

  Future<void> addKeyword(String word) {
    final w = word.trim();
    if (w.isEmpty) return Future.value();
    return _mutate((s) => s.copyWith(keywords: [...s.keywords, w]));
  }

  Future<void> removeKeyword(int index) => _mutate((s) {
    final kw = List<String>.from(s.keywords)..removeAt(index);
    return s.copyWith(keywords: kw);
  });

  Future<void> toggleDay(int index) => _mutate((s) {
    final days = List<bool>.from(s.activeDays);
    days[index] = !days[index];
    return s.copyWith(activeDays: days);
  });

  Future<void> setStrictness(int value) =>
      _mutate((s) => s.copyWith(strictness: value));

  Future<void> setAppLimits(
    int index, {
    int? openLimitPerDay,
    bool clearOpenLimit = false,
    int? timeLimitMinutes,
    bool clearTimeLimit = false,
  }) =>
      _mutate((s) {
        final apps = List<AppEntry>.from(s.apps);
        apps[index] = apps[index].copyWith(
          openLimitPerDay: openLimitPerDay,
          timeLimitMinutes: timeLimitMinutes,
          clearOpenLimit: clearOpenLimit,
          clearTimeLimit: clearTimeLimit,
        );
        return s.copyWith(apps: apps);
      });

  Future<void> _mutate(BlockSettings Function(BlockSettings) fn) async {
    final current = state.valueOrNull;
    if (current == null) return;
    final next = fn(current);
    state = AsyncData(next);
    await _repo.save(next);
    await _syncToNative(next);
  }

  Future<void> _syncToNative(BlockSettings s) async {
    final blockedPackages = s.apps
        .where((a) => a.blocked && a.packageName != null)
        .map((a) => a.packageName!)
        .toList();
    await BlockingChannel.updateBlockedApps(blockedPackages);
    await BlockingChannel.updateBlockedKeywords(s.keywords);
    await BlockingChannel.setStrictness(s.strictness);

    if (s.keywords.isNotEmpty) {
      if (await BlockingChannel.hasVpnPermission()) {
        await BlockingChannel.startVpn();
      }
    } else {
      await BlockingChannel.stopVpn();
    }

    final limits = <String, Map<String, int?>>{};
    for (final a in s.apps) {
      if (a.packageName == null) continue;
      if (a.openLimitPerDay == null && a.timeLimitMinutes == null) continue;
      limits[a.packageName!] = {
        'openLimit': a.openLimitPerDay,
        'timeLimit': a.timeLimitMinutes,
      };
    }
    await BlockingChannel.updateAppLimits(limits);
  }
}

final blockSettingsProvider =
    AsyncNotifierProvider<BlockSettingsNotifier, BlockSettings>(
        BlockSettingsNotifier.new);
