// lib/features/block/platform/blocking_channel.dart
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Dart interface to the native Android blocking engine.
/// All methods are no-ops on web/iOS (returns safe defaults).
class BlockingChannel {
  static const _ch = MethodChannel('com.example.clarity/blocking');

  // ── Permissions ────────────────────────────────────────────────────────────

  static Future<bool> hasUsagePermission() async {
    if (!_isAndroid) return false;
    return await _ch.invokeMethod<bool>('hasUsagePermission') ?? false;
  }

  static Future<void> requestUsagePermission() async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('requestUsagePermission');
  }

  static Future<bool> hasAccessibilityPermission() async {
    if (!_isAndroid) return false;
    return await _ch.invokeMethod<bool>('hasAccessibilityPermission') ?? false;
  }

  static Future<void> requestAccessibilityPermission() async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('requestAccessibilityPermission');
  }

  static Future<bool> hasVpnPermission() async {
    if (!_isAndroid) return false;
    return await _ch.invokeMethod<bool>('hasVpnPermission') ?? false;
  }

  static Future<void> requestVpnPermission() async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('requestVpnPermission');
  }

  /// Returns base64-encoded PNG of the app's launcher icon, or null.
  static Future<String?> getAppIcon(String packageName) async {
    if (!_isAndroid) return null;
    try {
      return await _ch.invokeMethod<String>('getAppIcon', {'packageName': packageName});
    } on PlatformException {
      return null;
    }
  }

  /// Returns list of {packageName, appName} for all launchable apps on device.
  static Future<List<Map<String, dynamic>>> getInstalledApps() async {
    if (!_isAndroid) return [];
    try {
      final json = await _ch.invokeMethod<String>('getInstalledApps');
      if (json == null) return [];
      final list = jsonDecode(json) as List;
      return list.cast<Map<String, dynamic>>();
    } on PlatformException {
      return [];
    }
  }

  // ── Usage stats ────────────────────────────────────────────────────────────

  /// Returns list of {packageName, appName, minutesUsed} for today.
  static Future<List<Map<String, dynamic>>> getTodayUsage() async {
    if (!_isAndroid) return [];
    try {
      final json = await _ch.invokeMethod<String>('getTodayUsage');
      if (json == null) return [];
      final list = jsonDecode(json) as List;
      return list.cast<Map<String, dynamic>>();
    } on PlatformException {
      return [];
    }
  }

  static Future<int> getTotalMinutesToday() async {
    if (!_isAndroid) return 0;
    try {
      return await _ch.invokeMethod<int>('getTotalMinutesToday') ?? 0;
    } on PlatformException {
      return 0;
    }
  }

  // ── App activity (screen time / opens / notifications) ──────────────────────

  static Future<bool> hasNotificationPermission() async {
    if (!_isAndroid) return false;
    return await _ch.invokeMethod<bool>('hasNotificationPermission') ?? false;
  }

  static Future<void> requestNotificationPermission() async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('requestNotificationPermission');
  }

  /// Returns list of {packageName, appName, opens} between [dayStart, dayEnd).
  static Future<List<Map<String, dynamic>>> getAppOpens({
    int? dayStart,
    int? dayEnd,
  }) async {
    if (!_isAndroid) return [];
    try {
      final json = await _ch.invokeMethod<String>('getAppOpens', {
        if (dayStart != null) 'dayStart': dayStart,
        if (dayEnd != null) 'dayEnd': dayEnd,
      });
      if (json == null) return [];
      final list = jsonDecode(json) as List;
      return list.cast<Map<String, dynamic>>();
    } on PlatformException {
      return [];
    }
  }

  /// Returns list of {packageName, appName, notifications} for the given day.
  static Future<List<Map<String, dynamic>>> getNotificationsForDay({
    int? dayStart,
  }) async {
    if (!_isAndroid) return [];
    try {
      final json = await _ch.invokeMethod<String>('getNotificationsForDay', {
        if (dayStart != null) 'dayStart': dayStart,
      });
      if (json == null) return [];
      final list = jsonDecode(json) as List;
      return list.cast<Map<String, dynamic>>();
    } on PlatformException {
      return [];
    }
  }

  /// metric: "screenTime" | "opens" | "notifications".
  /// Returns 7 entries {dateMillis, value}, oldest first.
  static Future<List<Map<String, dynamic>>> getWeeklyTotals(
      String metric) async {
    if (!_isAndroid) return [];
    try {
      final json =
          await _ch.invokeMethod<String>('getWeeklyTotals', {'metric': metric});
      if (json == null) return [];
      final list = jsonDecode(json) as List;
      return list.cast<Map<String, dynamic>>();
    } on PlatformException {
      return [];
    }
  }

  // ── Block config (synced to native services) ───────────────────────────────

  static Future<void> updateBlockedApps(List<String> packages) async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('updateBlockedApps', {'packages': packages});
  }

  static Future<void> updateBlockedDomains(List<String> domains) async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('updateBlockedDomains', {'domains': domains});
  }

  static Future<void> updateBlockedKeywords(List<String> keywords) async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('updateBlockedKeywords', {'keywords': keywords});
  }

  static Future<void> setStrictness(int level) async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('setStrictness', {'level': level});
  }

  /// limits: {packageName: {"openLimit": int?, "timeLimit": int? (minutes)}}
  static Future<void> updateAppLimits(
      Map<String, Map<String, int?>> limits) async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('updateAppLimits', {'limits': jsonEncode(limits)});
  }

  /// Returns {packageName: {opens: int, minutesUsed: int}} for today.
  static Future<Map<String, dynamic>> getAppLimitStats() async {
    if (!_isAndroid) return {};
    try {
      final json = await _ch.invokeMethod<String>('getAppLimitStats');
      if (json == null) return {};
      return jsonDecode(json) as Map<String, dynamic>;
    } on PlatformException {
      return {};
    }
  }

  // ── Location blocking ─────────────────────────────────────────────────────

  static Future<bool> hasLocationPermission() async {
    if (!_isAndroid) return false;
    return await _ch.invokeMethod<bool>('hasLocationPermission') ?? false;
  }

  static Future<void> requestLocationPermission() async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('requestLocationPermission');
  }

  /// Returns {lat, lng, accuracy} or throws if unavailable.
  static Future<Map<String, double>> getCurrentLocation() async {
    if (!_isAndroid) throw UnsupportedError('Location only available on Android');
    final raw = await _ch.invokeMethod<Map>('getCurrentLocation');
    if (raw == null) throw PlatformException(code: 'UNAVAILABLE', message: 'No location returned');
    return {
      'lat':      (raw['lat']      as num).toDouble(),
      'lng':      (raw['lng']       as num).toDouble(),
      'accuracy': (raw['accuracy']  as num).toDouble(),
    };
  }

  /// Saves rule to native, registers geofence, returns the assigned id.
  static Future<String> saveLocationRule({
    required String name,
    required double lat,
    required double lng,
    required double radiusMeters,
    required List<String> packageNames,
    required List<String> appNames,
  }) async {
    if (!_isAndroid) return DateTime.now().millisecondsSinceEpoch.toString();
    final id = await _ch.invokeMethod<String>('saveLocationRule', {
      'name':     name,
      'lat':      lat,
      'lng':      lng,
      'radius':   radiusMeters,
      'packages': packageNames,
      'appNames': appNames,
    });
    return id ?? DateTime.now().millisecondsSinceEpoch.toString();
  }

  static Future<void> removeLocationRule(String id) async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('removeLocationRule', {'id': id});
  }

  static Future<List<Map<String, dynamic>>> getLocationRules() async {
    if (!_isAndroid) return [];
    try {
      final json = await _ch.invokeMethod<String>('getLocationRules');
      if (json == null || json == '[]') return [];
      final list = jsonDecode(json) as List;
      return list.cast<Map<String, dynamic>>();
    } on PlatformException { return []; }
  }

  static Future<List<String>> getActiveGeofences() async {
    if (!_isAndroid) return [];
    try {
      final list = await _ch.invokeMethod<List>('getActiveGeofences');
      return list?.cast<String>() ?? [];
    } on PlatformException { return []; }
  }

  // ── Time-window blocking ────────────────────────────────────────────────

  /// Saves rule to native, returns the assigned id.
  static Future<String> saveTimeRule({
    required String name,
    required int startMinutes,
    required int endMinutes,
    required List<bool> days,
    required List<String> packageNames,
    required List<String> appNames,
  }) async {
    if (!_isAndroid) return DateTime.now().millisecondsSinceEpoch.toString();
    final id = await _ch.invokeMethod<String>('saveTimeRule', {
      'name':     name,
      'start':    startMinutes,
      'end':      endMinutes,
      'days':     days,
      'packages': packageNames,
      'appNames': appNames,
    });
    return id ?? DateTime.now().millisecondsSinceEpoch.toString();
  }

  static Future<void> removeTimeRule(String id) async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('removeTimeRule', {'id': id});
  }

  static Future<List<Map<String, dynamic>>> getTimeRules() async {
    if (!_isAndroid) return [];
    try {
      final json = await _ch.invokeMethod<String>('getTimeRules');
      if (json == null || json == '[]') return [];
      final list = jsonDecode(json) as List;
      return list.cast<Map<String, dynamic>>();
    } on PlatformException { return []; }
  }

  // ── VPN ───────────────────────────────────────────────────────────────────

  static Future<void> startVpn() async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('startVpn');
  }

  static Future<void> stopVpn() async {
    if (!_isAndroid) return;
    await _ch.invokeMethod('stopVpn');
  }

  static bool get _isAndroid =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;
}
