// lib/features/dashboard/data/streak_repository.dart
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

import '../domain/streak_model.dart';

class StreakRepository {
  static const _key = 'streak_data';

  Future<StreakModel> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw   = prefs.getString(_key);
    if (raw == null) return StreakModel.empty;
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return StreakModel.fromJson(json);
    } catch (_) {
      return StreakModel.empty;
    }
  }

  Future<void> save(StreakModel model) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(model.toJson()));
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
