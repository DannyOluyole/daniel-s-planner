// lib/core/theme/theme_provider.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kDarkModeKey = 'dark_mode';

class ThemeNotifier extends Notifier<ThemeMode> {
  SharedPreferences? _prefs;

  @override
  ThemeMode build() {
    _load();
    return ThemeMode.light; // default is light
  }

  Future<void> _load() async {
    _prefs = await SharedPreferences.getInstance();
    final isDark = _prefs!.getBool(_kDarkModeKey) ?? false;
    state = isDark ? ThemeMode.dark : ThemeMode.light;
  }

  void toggle() {
    final next = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    state = next;
    // Persist in the background — the UI/theme has already switched above.
    _prefs?.setBool(_kDarkModeKey, next == ThemeMode.dark);
  }

  bool get isDark => state == ThemeMode.dark;
}

final themeProvider =
    NotifierProvider<ThemeNotifier, ThemeMode>(ThemeNotifier.new);
