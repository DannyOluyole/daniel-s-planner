// lib/features/profile/presentation/screens/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../auth/application/auth_provider.dart';
import '../../../dashboard/application/streak_notifier.dart';
import '../../application/profile_notifier.dart';
import '../../domain/profile_model.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authUser      = ref.watch(currentUserProvider);
    final settingsAsync = ref.watch(profileSettingsProvider);
    final streak        = ref.watch(streakNotifierProvider);

    final currentStreak = streak.valueOrNull?.currentStreak ?? 0;
    final bestStreak    = streak.valueOrNull?.bestStreak    ?? 0;
    final totalBlocks   = streak.valueOrNull?.totalBlocksAllTime ?? 0;

    return Scaffold(
      backgroundColor: ClarityColors.bgSurface,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          children: [
            const SizedBox(height: 16),
            authUser != null
                ? _AuthHero(user: authUser)
                : ref.watch(userProfileProvider).when(
                    loading: () => const _HeroSkeleton(),
                    error:   (_, __) => const _HeroSkeleton(),
                    data:    (p) => _ProfileHero(profile: p),
                  ),
            const SizedBox(height: 14),
            _StreakBanner(
              currentStreak: currentStreak,
              bestStreak:    bestStreak,
              totalBlocks:   totalBlocks,
            ),
            const SizedBox(height: 14),
            const _SectionLabel('LIFETIME STATS'),
            const SizedBox(height: 8),
            _StatsGrid(
              totalBlocks:   totalBlocks,
              currentStreak: currentStreak,
            ),
            const SizedBox(height: 14),
            const _SectionLabel('BADGES'),
            const SizedBox(height: 8),
            _BadgesRow(
              badges: computeBadges(
                currentStreak: currentStreak,
                bestStreak:    bestStreak,
                totalBlocks:   totalBlocks,
              ),
            ),
            const SizedBox(height: 14),
            const _SectionLabel('SETTINGS'),
            const SizedBox(height: 8),
            settingsAsync.when(
              loading: () => const SizedBox(height: 200),
              error:   (_, __) => const SizedBox(height: 200),
              data:    (s) => _SettingsCard(settings: s),
            ),
            const SizedBox(height: 14),
            const _SignOutButton(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({required this.profile});
  final UserProfile profile;

  String get _initials {
    final parts = profile.displayName.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0].substring(0, parts[0].length.clamp(1, 2)).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                color: ClarityColors.purpleDeep,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(_initials,
                    style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w500,
                        color: ClarityColors.textPrimary)),
              ),
            ),
            Positioned(
              bottom: -2,
              right: -2,
              child: Container(
                width: 22,
                height: 22,
                decoration: const BoxDecoration(
                  color: ClarityColors.bg,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                    child: Text('🔥', style: TextStyle(fontSize: 12))),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(profile.displayName,
            style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: ClarityColors.textPrimary)),
        const SizedBox(height: 2),
        Text(
            '@${profile.username} · joined ${DateFormat('MMMM yyyy').format(profile.joinDate)}',
            style: const TextStyle(
                fontSize: 13, color: ClarityColors.textDisabled)),
      ],
    );
  }
}

// Hero for authenticated Firebase users
class _AuthHero extends StatelessWidget {
  const _AuthHero({required this.user});
  final dynamic user; // ClarityUser

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                color: ClarityColors.purpleDeep,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(user.initials as String,
                    style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w500,
                        color: ClarityColors.textPrimary)),
              ),
            ),
            Positioned(
              bottom: -2,
              right: -2,
              child: Container(
                width: 22,
                height: 22,
                decoration: const BoxDecoration(
                    color: ClarityColors.bg, shape: BoxShape.circle),
                child: const Center(
                    child: Text('🔥', style: TextStyle(fontSize: 12))),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(user.displayName as String? ?? user.email as String,
            style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: ClarityColors.textPrimary)),
        const SizedBox(height: 2),
        Text(user.email as String,
            style: const TextStyle(
                fontSize: 13, color: ClarityColors.textDisabled)),
      ],
    );
  }
}

class _HeroSkeleton extends StatelessWidget {
  const _HeroSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: const BoxDecoration(
            color: ClarityColors.bgCard,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(height: 10),
        Container(width: 100, height: 14, color: ClarityColors.bgCard),
        const SizedBox(height: 6),
        Container(width: 160, height: 10, color: ClarityColors.bgCard),
      ],
    );
  }
}

// ─── Streak banner ───────────────────────────────────────────────────────────

class _StreakBanner extends StatelessWidget {
  const _StreakBanner({
    required this.currentStreak,
    required this.bestStreak,
    required this.totalBlocks,
  });
  final int currentStreak;
  final int bestStreak;
  final int totalBlocks;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: ClarityColors.purpleTint,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ClarityColors.purple, width: 0.5),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _BannerStat(
              value: '$currentStreak', label: 'day streak 🔥', large: true),
          const _BannerDivider(),
          _BannerStat(value: '$bestStreak',  label: 'best streak'),
          const _BannerDivider(),
          _BannerStat(value: '$totalBlocks', label: 'blocks total'),
        ],
      ),
    );
  }
}

class _BannerStat extends StatelessWidget {
  const _BannerStat(
      {required this.value, required this.label, this.large = false});
  final String value;
  final String label;
  final bool   large;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value,
            style: TextStyle(
                fontSize: large ? 32 : 18,
                fontWeight: FontWeight.w500,
                color: ClarityColors.textPrimary)),
        Text(label,
            style: const TextStyle(
                fontSize: 10, color: ClarityColors.purpleLight)),
      ],
    );
  }
}

class _BannerDivider extends StatelessWidget {
  const _BannerDivider();

  @override
  Widget build(BuildContext context) {
    return Container(width: 0.5, height: 40, color: ClarityColors.border);
  }
}

// ─── Stats grid ───────────────────────────────────────────────────────────────

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.totalBlocks, required this.currentStreak});
  final int totalBlocks;
  final int currentStreak;

  String get _screenTimeSaved {
    final minutes = totalBlocks * 9;
    if (minutes < 60) return '${minutes}m';
    return '${(minutes / 60).round()}h';
  }

  String get _daysBack {
    final days = (totalBlocks * 9) ~/ 60 ~/ 24;
    return '≈ $days day${days == 1 ? '' : 's'} back';
  }

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.5,
      children: [
        _StatCard(
            value: _screenTimeSaved,
            label: 'Screen time saved',
            delta: _daysBack),
        _StatCard(
            value: '$totalBlocks',
            label: 'Urges blocked',
            delta: totalBlocks > 0 ? 'lifetime total' : 'none yet'),
        _StatCard(
            value: '$currentStreak',
            label: 'Day streak',
            delta: currentStreak > 0
                ? '$currentStreak day${currentStreak == 1 ? '' : 's'} running'
                : 'start today!'),
        const _StatCard(
            value: '—',
            label: 'People supported',
            delta: 'in community'),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard(
      {required this.value, required this.label, required this.delta});
  final String value;
  final String label;
  final String delta;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ClarityColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ClarityColors.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value,
              style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w500,
                  color: ClarityColors.textPrimary)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(
                  fontSize: 11, color: ClarityColors.textDisabled)),
          const SizedBox(height: 4),
          Text(delta,
              style:
                  const TextStyle(fontSize: 11, color: ClarityColors.teal)),
        ],
      ),
    );
  }
}

// ─── Badges ──────────────────────────────────────────────────────────────────

class _BadgesRow extends StatelessWidget {
  const _BadgesRow({required this.badges});
  final List<ClarityBadge> badges;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: badges.map((b) {
        return Opacity(
          opacity: b.earned ? 1.0 : 0.4,
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: b.earned
                  ? ClarityColors.purpleTint
                  : ClarityColors.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: b.earned
                    ? ClarityColors.purple
                    : ClarityColors.border,
                width: 0.5,
              ),
            ),
            child: Column(
              children: [
                Text(b.emoji, style: const TextStyle(fontSize: 22)),
                const SizedBox(height: 4),
                Text(b.label,
                    style: const TextStyle(
                        fontSize: 9, color: ClarityColors.purplePale)),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ─── Settings card ───────────────────────────────────────────────────────────

class _SettingsCard extends ConsumerWidget {
  const _SettingsCard({required this.settings});
  final ProfileSettings settings;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(profileSettingsProvider.notifier);
    return Container(
      decoration: BoxDecoration(
        color: ClarityColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ClarityColors.border, width: 0.5),
      ),
      child: Column(
        children: [
          _ToggleRow(
            iconBg:    ClarityColors.purpleTint,
            icon:      TablerIcons.bell,
            iconColor: ClarityColors.purpleLight,
            label:     'Notifications',
            value:     settings.notifications,
            onChanged: notifier.setNotifications,
          ),
          _ToggleRow(
            iconBg:    ClarityColors.tealTint,
            icon:      TablerIcons.moon,
            iconColor: ClarityColors.teal,
            label:     'Bedtime mode',
            value:     settings.bedtimeMode,
            onChanged: notifier.setBedtimeMode,
          ),
          _ToggleRow(
            iconBg:    ClarityColors.amberTint,
            icon:      TablerIcons.user_circle,
            iconColor: ClarityColors.amber,
            label:     'Anonymous mode',
            value:     settings.anonymousMode,
            onChanged: notifier.setAnonymousMode,
          ),
          _ArrowRow(
            iconBg:    ClarityColors.bgCard,
            icon:      TablerIcons.target,
            iconColor: ClarityColors.purplePale,
            label:     'Daily screen limit',
            value:     '${settings.dailyLimitHours} hr',
          ),
          _ArrowRow(
            iconBg:    ClarityColors.bgCard,
            icon:      TablerIcons.lock,
            iconColor: ClarityColors.purplePale,
            label:     'PIN lock',
            value:     settings.pinEnabled ? 'On' : 'Off',
          ),
          _ArrowRow(
            iconBg:    ClarityColors.bgCard,
            icon:      TablerIcons.heart_handshake,
            iconColor: ClarityColors.pink,
            label:     'Accountability partner',
            value:     'Add',
            isLast:    true,
          ),
        ],
      ),
    );
  }
}

class _ToggleRow extends StatelessWidget {
  const _ToggleRow({
    required this.iconBg,
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    required this.onChanged,
    this.isLast = false,
  });
  final Color              iconBg;
  final IconData           icon;
  final Color              iconColor;
  final String             label;
  final bool               value;
  final ValueChanged<bool> onChanged;
  final bool               isLast;

  @override
  Widget build(BuildContext context) {
    return _SettingsRow(
      iconBg:    iconBg,
      icon:      icon,
      iconColor: iconColor,
      label:     label,
      isLast:    isLast,
      trailing:  _MiniSwitch(value: value, onChanged: onChanged),
    );
  }
}

class _ArrowRow extends StatelessWidget {
  const _ArrowRow({
    required this.iconBg,
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    this.isLast = false,
  });
  final Color    iconBg;
  final IconData icon;
  final Color    iconColor;
  final String   label;
  final String   value;
  final bool     isLast;

  @override
  Widget build(BuildContext context) {
    return _SettingsRow(
      iconBg:    iconBg,
      icon:      icon,
      iconColor: iconColor,
      label:     label,
      isLast:    isLast,
      trailing:  Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(value,
              style: const TextStyle(
                  fontSize: 12, color: ClarityColors.textDisabled)),
          const SizedBox(width: 4),
          const Icon(TablerIcons.chevron_right,
              size: 16, color: ClarityColors.border),
        ],
      ),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({
    required this.iconBg,
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.trailing,
    this.isLast = false,
  });
  final Color    iconBg;
  final IconData icon;
  final Color    iconColor;
  final String   label;
  final Widget   trailing;
  final bool     isLast;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(
                bottom: BorderSide(
                    color: ClarityColors.borderFaint, width: 0.5)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label,
                style: const TextStyle(
                    fontSize: 13, color: ClarityColors.textSecondary)),
          ),
          trailing,
        ],
      ),
    );
  }
}

class _MiniSwitch extends StatelessWidget {
  const _MiniSwitch({required this.value, required this.onChanged});
  final bool               value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        width: 40,
        height: 24,
        decoration: BoxDecoration(
          color: value ? ClarityColors.purple : ClarityColors.border,
          borderRadius: BorderRadius.circular(12),
        ),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 250),
          alignment: value ? Alignment.centerRight : Alignment.centerLeft,
          child: Padding(
            padding: const EdgeInsets.all(3),
            child: Container(
              width: 18,
              height: 18,
              decoration: const BoxDecoration(
                color: ClarityColors.textPrimary,
                shape: BoxShape.circle,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

class _SignOutButton extends ConsumerWidget {
  const _SignOutButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return OutlinedButton(
      onPressed: () => ref.read(authNotifierProvider.notifier).signOut(),
      style: OutlinedButton.styleFrom(
        foregroundColor: ClarityColors.red,
        side: const BorderSide(color: ClarityColors.redDark, width: 0.5),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        padding: const EdgeInsets.symmetric(vertical: 14),
        minimumSize: const Size(double.infinity, 50),
      ),
      child: const Text('Sign out', style: TextStyle(fontSize: 14)),
    );
  }
}

// ─── Shared ───────────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(label,
        style: const TextStyle(
            fontSize: 11,
            color: ClarityColors.textDisabled,
            letterSpacing: 0.8));
  }
}
