// lib/features/profile/application/profile_notifier.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/profile_repository.dart';
import '../domain/profile_model.dart';

final profileRepositoryProvider =
    Provider<ProfileRepository>((_) => ProfileRepository());

// ─── User profile ─────────────────────────────────────────────────────────────

class UserProfileNotifier extends AsyncNotifier<UserProfile> {
  ProfileRepository get _repo => ref.read(profileRepositoryProvider);

  @override
  Future<UserProfile> build() => _repo.loadProfile();

  Future<void> updateDisplayName(String name) => _mutate(
        (p) => p.copyWith(displayName: name.trim().isEmpty ? p.displayName : name.trim()),
      );

  Future<void> _mutate(UserProfile Function(UserProfile) fn) async {
    final current = state.valueOrNull;
    if (current == null) return;
    final next = fn(current);
    state = AsyncData(next);
    await _repo.saveProfile(next);
  }
}

final userProfileProvider =
    AsyncNotifierProvider<UserProfileNotifier, UserProfile>(
        UserProfileNotifier.new);

// ─── Profile settings ─────────────────────────────────────────────────────────

class ProfileSettingsNotifier extends AsyncNotifier<ProfileSettings> {
  ProfileRepository get _repo => ref.read(profileRepositoryProvider);

  @override
  Future<ProfileSettings> build() => _repo.loadSettings();

  Future<void> setNotifications(bool v)  => _mutate((s) => s.copyWith(notifications: v));
  Future<void> setBedtimeMode(bool v)    => _mutate((s) => s.copyWith(bedtimeMode: v));
  Future<void> setAnonymousMode(bool v)  => _mutate((s) => s.copyWith(anonymousMode: v));
  Future<void> setDailyLimit(int hours)  => _mutate((s) => s.copyWith(dailyLimitHours: hours));
  Future<void> setPinEnabled(bool v)     => _mutate((s) => s.copyWith(pinEnabled: v));

  Future<void> _mutate(ProfileSettings Function(ProfileSettings) fn) async {
    final current = state.valueOrNull;
    if (current == null) return;
    final next = fn(current);
    state = AsyncData(next);
    await _repo.saveSettings(next);
  }
}

final profileSettingsProvider =
    AsyncNotifierProvider<ProfileSettingsNotifier, ProfileSettings>(
        ProfileSettingsNotifier.new);

// ─── Badge helper ─────────────────────────────────────────────────────────────

class ClarityBadge {
  const ClarityBadge({
    required this.emoji,
    required this.label,
    required this.earned,
  });
  final String emoji;
  final String label;
  final bool   earned;
}

List<ClarityBadge> computeBadges({
  required int currentStreak,
  required int bestStreak,
  required int totalBlocks,
}) =>
    [
      ClarityBadge(emoji: '🌱', label: 'First week',  earned: bestStreak >= 7),
      ClarityBadge(emoji: '🔥', label: '14 days',     earned: bestStreak >= 14),
      ClarityBadge(emoji: '🛡️', label: '100 blocks',  earned: totalBlocks >= 100),
      ClarityBadge(emoji: '💎', label: '30 days',     earned: bestStreak >= 30),
      ClarityBadge(emoji: '🏆', label: '60 days',     earned: bestStreak >= 60),
    ];
