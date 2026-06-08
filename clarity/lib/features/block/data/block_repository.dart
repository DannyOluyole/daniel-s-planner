// lib/features/block/data/block_repository.dart
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'block_model.dart';

class BlockRepository {
  static const _key = 'block_settings';

  Future<BlockSettings> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return BlockSettings.defaultSettings;
    try {
      return BlockSettings.fromJson(json.decode(raw) as Map<String, dynamic>);
    } catch (_) {
      return BlockSettings.defaultSettings;
    }
  }

  Future<void> save(BlockSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, json.encode(settings.toJson()));
  }
}
