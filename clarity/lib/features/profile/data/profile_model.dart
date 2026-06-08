import 'package:flutter_riverpod/flutter_riverpod.dart';

class ClarityBadge {
  const ClarityBadge({required this.emoji, required this.label, required this.earned});
  final String emoji;
  final String label;
  final bool   earned;
}

class ProfileSettings {
  const ProfileSettings({
    required this.notifications,
    required this.bedtimeMode,
    required this.anonymous,
  });

  final bool notifications;
  final bool bedtimeMode;
  final bool anonymous;

  ProfileSettings copyWith({bool? notifications, bool? bedtimeMode, bool? anonymous}) =>
      ProfileSettings(
        notifications: notifications ?? this.notifications,
        bedtimeMode:   bedtimeMode   ?? this.bedtimeMode,
        anonymous:     anonymous     ?? this.anonymous,
      );
}

class UserProfile {
  const UserProfile({
    required this.displayName,
    required this.handle,
    required this.initials,
    required this.joinedLabel,
    required this.streakDays,
    required this.bestStreak,
    required this.totalBlocks,
    required this.screenTimeSaved,
    required this.checkInsLogged,
    required this.peopleSupported,
    required this.badges,
    required this.settings,
    required this.dailyScreenLimit,
    required this.pinEnabled,
    required this.accountabilityPartner,
  });

  final String           displayName;
  final String           handle;
  final String           initials;
  final String           joinedLabel;
  final int              streakDays;
  final int              bestStreak;
  final int              totalBlocks;
  final String           screenTimeSaved;
  final int              checkInsLogged;
  final int              peopleSupported;
  final List<ClarityBadge>      badges;
  final ProfileSettings  settings;
  final String           dailyScreenLimit;
  final bool             pinEnabled;
  final String?          accountabilityPartner;
}

class ProfileNotifier extends StateNotifier<UserProfile> {
  ProfileNotifier()
      : super(const UserProfile(
          displayName:          'Danny Kay',
          handle:               '@dannyk · joined June 2025',
          initials:             'DK',
          joinedLabel:          'June 2025',
          streakDays:           14,
          bestStreak:           21,
          totalBlocks:          312,
          screenTimeSaved:      '47h',
          checkInsLogged:       28,
          peopleSupported:      9,
          dailyScreenLimit:     '2 hr',
          pinEnabled:           false,
          accountabilityPartner: null,
          badges: [
            ClarityBadge(emoji: '🌱', label: 'First week', earned: true),
            ClarityBadge(emoji: '🔥', label: '14 days',    earned: true),
            ClarityBadge(emoji: '🛡️', label: '100 blocks', earned: true),
            ClarityBadge(emoji: '💎', label: '30 days',    earned: false),
            ClarityBadge(emoji: '🏆', label: '60 days',    earned: false),
          ],
          settings: ProfileSettings(
            notifications: true,
            bedtimeMode:   true,
            anonymous:     false,
          ),
        ));

  void updateSettings(ProfileSettings s) =>
      state = UserProfile(
        displayName:          state.displayName,
        handle:               state.handle,
        initials:             state.initials,
        joinedLabel:          state.joinedLabel,
        streakDays:           state.streakDays,
        bestStreak:           state.bestStreak,
        totalBlocks:          state.totalBlocks,
        screenTimeSaved:      state.screenTimeSaved,
        checkInsLogged:       state.checkInsLogged,
        peopleSupported:      state.peopleSupported,
        dailyScreenLimit:     state.dailyScreenLimit,
        pinEnabled:           state.pinEnabled,
        accountabilityPartner: state.accountabilityPartner,
        badges:               state.badges,
        settings:             s,
      );
}

final profileProvider =
    StateNotifierProvider<ProfileNotifier, UserProfile>((_) => ProfileNotifier());
