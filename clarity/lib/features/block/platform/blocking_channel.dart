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
