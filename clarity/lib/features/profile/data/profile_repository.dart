// lib/features/profile/data/profile_repository.dart
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../domain/profile_model.dart';

class ProfileRepository {
  static const _profileKey  = 'user_profile';
  static const _settingsKey = 'profile_settings';

  Future<UserProfile> loadProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_profileKey);
    if (raw == null) return UserProfile.defaultProfile;
    try {
      return UserProfile.fromJson(json.decode(raw) as Map<String, dynamic>);
    } catch (_) {
      return UserProfile.defaultProfile;
    }
  }

  Future<void> saveProfile(UserProfile profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_profileKey, json.encode(profile.toJson()));
  }

  Future<ProfileSettings> loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_settingsKey);
    if (raw == null) return ProfileSettings.defaults;
    try {
      return ProfileSettings.fromJson(json.decode(raw) as Map<String, dynamic>);
    } catch (_) {
      return ProfileSettings.defaults;
    }
  }

  Future<void> saveSettings(ProfileSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_settingsKey, json.encode(settings.toJson()));
  }
}
