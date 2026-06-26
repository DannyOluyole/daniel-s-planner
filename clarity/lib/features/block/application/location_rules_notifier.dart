import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/location_rule.dart';
import '../platform/blocking_channel.dart';

class LocationRulesNotifier extends AsyncNotifier<List<LocationRule>> {
  @override
  Future<List<LocationRule>> build() => _load();

  Future<List<LocationRule>> _load() async {
    final json = await BlockingChannel.getLocationRules();
    return json
        .map((m) => LocationRule.fromJson(m))
        .toList();
  }

  Future<void> addRule({
    required String name,
    required double lat,
    required double lng,
    required double radiusMeters,
    required List<String> packageNames,
    required List<String> appNames,
  }) async {
    final id = await BlockingChannel.saveLocationRule(
      name: name,
      lat: lat,
      lng: lng,
      radiusMeters: radiusMeters,
      packageNames: packageNames,
      appNames: appNames,
    );
    final rule = LocationRule(
      id: id,
      name: name,
      lat: lat,
      lng: lng,
      radiusMeters: radiusMeters,
      packageNames: packageNames,
      appNames: appNames,
    );
    state = AsyncData([...state.valueOrNull ?? [], rule]);
  }

  Future<void> removeRule(String id) async {
    await BlockingChannel.removeLocationRule(id);
    state = AsyncData((state.valueOrNull ?? []).where((r) => r.id != id).toList());
  }
}

final locationRulesProvider =
    AsyncNotifierProvider<LocationRulesNotifier, List<LocationRule>>(
        LocationRulesNotifier.new);

// Active geofences (rule IDs the device is currently inside)
final activeGeofencesProvider = FutureProvider.autoDispose<Set<String>>((ref) async {
  final ids = await BlockingChannel.getActiveGeofences();
  return ids.toSet();
});
