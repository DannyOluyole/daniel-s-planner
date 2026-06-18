// lib/features/block/data/block_repository.dart
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'block_model.dart';

class BlockRepository {
  static const _key = 'block_settings';
  static const _migrationKey = 'block_settings_legacy_seed_purged';

  /// Names that used to be hardcoded into `defaultSettings.apps` before the
  /// blocklist became fully user-managed. Any installs that persisted these
  /// pre-fix defaults need a one-time purge so users aren't stuck with them.
  static const _legacySeedNames = {'TikTok', 'Instagram', 'Reddit', 'X / Twitter'};

  Future<BlockSettings> load() async {
    final prefs = await SharedPreferences.getInstance();
    await _purgeLegacySeedIfNeeded(prefs);
    final raw = prefs.getString(_key);
    if (raw == null) return BlockSettings.defaultSettings;
    try {
      return BlockSettings.fromJson(json.decode(raw) as Map<String, dynamic>);
    } catch (_) {
      return BlockSettings.defaultSettings;
    }
  }

  Future<void> _purgeLegacySeedIfNeeded(SharedPreferences prefs) async {
    if (prefs.getBool(_migrationKey) == true) return;
    final raw = prefs.getString(_key);
    if (raw != null) {
      try {
        final decoded = BlockSettings.fromJson(json.decode(raw) as Map<String, dynamic>);
        final isUntouchedLegacySeed = decoded.apps.isNotEmpty &&
            decoded.apps.every((a) =>
                _legacySeedNames.contains(a.name) && a.packageName == null);
        if (isUntouchedLegacySeed) {
          final cleaned = decoded.copyWith(apps: const []);
          await prefs.setString(_key, json.encode(cleaned.toJson()));
        }
      } catch (_) {
        // Corrupt data will fall through to defaultSettings in load().
      }
    }
    await prefs.setBool(_migrationKey, true);
  }

  Future<void> save(BlockSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, json.encode(settings.toJson()));
  }
}
