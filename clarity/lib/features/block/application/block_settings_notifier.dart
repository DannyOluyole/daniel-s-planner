// lib/features/block/application/block_settings_notifier.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/block_model.dart';
import '../data/block_repository.dart';

final blockRepositoryProvider = Provider<BlockRepository>((_) => BlockRepository());

class BlockSettingsNotifier extends AsyncNotifier<BlockSettings> {
  BlockRepository get _repo => ref.read(blockRepositoryProvider);

  @override
  Future<BlockSettings> build() => _repo.load();

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

  Future<void> _mutate(BlockSettings Function(BlockSettings) fn) async {
    final current = state.valueOrNull;
    if (current == null) return;
    final next = fn(current);
    state = AsyncData(next);
    await _repo.save(next);
  }
}

final blockSettingsProvider =
    AsyncNotifierProvider<BlockSettingsNotifier, BlockSettings>(
        BlockSettingsNotifier.new);
