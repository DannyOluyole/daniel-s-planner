// lib/features/profile/domain/profile_model.dart

class UserProfile {
  const UserProfile({
    required this.displayName,
    required this.username,
    required this.joinDate,
  });

  final String   displayName;
  final String   username;
  final DateTime joinDate;

  static UserProfile get defaultProfile => UserProfile(
        displayName: 'Guest',
        username: 'guest',
        joinDate: DateTime.now(),
      );

  UserProfile copyWith({String? displayName, String? username, DateTime? joinDate}) =>
      UserProfile(
        displayName: displayName ?? this.displayName,
        username:    username    ?? this.username,
        joinDate:    joinDate    ?? this.joinDate,
      );

  Map<String, dynamic> toJson() => {
        'displayName': displayName,
        'username':    username,
        'joinDate':    joinDate.toIso8601String(),
      };

  factory UserProfile.fromJson(Map<String, dynamic> j) => UserProfile(
        displayName: j['displayName'] as String,
        username:    j['username']    as String,
        joinDate:    DateTime.parse(j['joinDate'] as String),
      );
}

class ProfileSettings {
  const ProfileSettings({
    required this.notifications,
    required this.bedtimeMode,
    required this.anonymousMode,
    required this.dailyLimitHours,
    required this.pinEnabled,
    this.pinCode,
    this.accountabilityPartnerEmail,
  });

  static const defaults = ProfileSettings(
    notifications:   true,
    bedtimeMode:     true,
    anonymousMode:   false,
    dailyLimitHours: 2,
    pinEnabled:      false,
    pinCode:         null,
    accountabilityPartnerEmail: null,
  );

  final bool   notifications;
  final bool   bedtimeMode;
  final bool   anonymousMode;
  final int    dailyLimitHours;
  final bool   pinEnabled;
  final String? pinCode;
  final String? accountabilityPartnerEmail;

  ProfileSettings copyWith({
    bool?   notifications,
    bool?   bedtimeMode,
    bool?   anonymousMode,
    int?    dailyLimitHours,
    bool?   pinEnabled,
    String? pinCode,
    bool    clearPinCode = false,
    String? accountabilityPartnerEmail,
    bool    clearAccountabilityPartner = false,
  }) =>
      ProfileSettings(
        notifications:   notifications   ?? this.notifications,
        bedtimeMode:     bedtimeMode     ?? this.bedtimeMode,
        anonymousMode:   anonymousMode   ?? this.anonymousMode,
        dailyLimitHours: dailyLimitHours ?? this.dailyLimitHours,
        pinEnabled:      pinEnabled      ?? this.pinEnabled,
        pinCode:         clearPinCode ? null : (pinCode ?? this.pinCode),
        accountabilityPartnerEmail: clearAccountabilityPartner
            ? null
            : (accountabilityPartnerEmail ?? this.accountabilityPartnerEmail),
      );

  Map<String, dynamic> toJson() => {
        'notifications':   notifications,
        'bedtimeMode':     bedtimeMode,
        'anonymousMode':   anonymousMode,
        'dailyLimitHours': dailyLimitHours,
        'pinEnabled':      pinEnabled,
        'pinCode':         pinCode,
        'accountabilityPartnerEmail': accountabilityPartnerEmail,
      };

  factory ProfileSettings.fromJson(Map<String, dynamic> j) => ProfileSettings(
        notifications:   j['notifications']   as bool,
        bedtimeMode:     j['bedtimeMode']     as bool,
        anonymousMode:   j['anonymousMode']   as bool,
        dailyLimitHours: j['dailyLimitHours'] as int,
        pinEnabled:      j['pinEnabled']      as bool,
        pinCode:         j['pinCode']         as String?,
        accountabilityPartnerEmail: j['accountabilityPartnerEmail'] as String?,
      );
}
