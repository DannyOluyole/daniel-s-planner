import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/time_rule.dart';
import '../platform/blocking_channel.dart';

class TimeRulesNotifier extends AsyncNotifier<List<TimeRule>> {
  @override
  Future<List<TimeRule>> build() => _load();

  Future<List<TimeRule>> _load() async {
    final json = await BlockingChannel.getTimeRules();
    return json.map((m) => TimeRule.fromJson(m)).toList();
  }

  Future<void> addRule({
    required String name,
    required int startMinutes,
    required int endMinutes,
    required List<bool> days,
    required List<String> packageNames,
    required List<String> appNames,
  }) async {
    final id = await BlockingChannel.saveTimeRule(
      name: name,
      startMinutes: startMinutes,
      endMinutes: endMinutes,
      days: days,
      packageNames: packageNames,
      appNames: appNames,
    );
    final rule = TimeRule(
      id: id,
      name: name,
      startMinutes: startMinutes,
      endMinutes: endMinutes,
      days: days,
      packageNames: packageNames,
      appNames: appNames,
    );
    state = AsyncData([...state.valueOrNull ?? [], rule]);
  }

  Future<void> removeRule(String id) async {
    await BlockingChannel.removeTimeRule(id);
    state = AsyncData((state.valueOrNull ?? []).where((r) => r.id != id).toList());
  }
}

final timeRulesProvider =
    AsyncNotifierProvider<TimeRulesNotifier, List<TimeRule>>(TimeRulesNotifier.new);
