// lib/features/profile/presentation/screens/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/theme/theme_provider.dart';
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
      backgroundColor: ct.bgSurface,
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
            if (authUser != null) const _SignOutButton(),
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
              decoration: BoxDecoration(
                color: ct.purpleDeep,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(_initials,
                    style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w500,
                        color: ct.textPrimary)),
              ),
            ),
            Positioned(
              bottom: -2,
              right: -2,
              child: Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: ct.bg,
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
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: ct.textPrimary)),
        const SizedBox(height: 2),
        Text(
            '@${profile.username} · joined ${DateFormat('MMMM yyyy').format(profile.joinDate)}',
            style: TextStyle(
                fontSize: 13, color: ct.textDisabled)),
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
              decoration: BoxDecoration(
                color: ct.purpleDeep,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(user.initials as String,
                    style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w500,
                        color: ct.textPrimary)),
              ),
            ),
            Positioned(
              bottom: -2,
              right: -2,
              child: Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                    color: ct.bg, shape: BoxShape.circle),
                child: const Center(
                    child: Text('🔥', style: TextStyle(fontSize: 12))),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(user.displayName as String? ?? user.email as String,
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: ct.textPrimary)),
        const SizedBox(height: 2),
        Text(user.email as String,
            style: TextStyle(
                fontSize: 13, color: ct.textDisabled)),
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
          decoration: BoxDecoration(
            color: ct.bgCard,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(height: 10),
        Container(width: 100, height: 14, color: ct.bgCard),
        const SizedBox(height: 6),
        Container(width: 160, height: 10, color: ct.bgCard),
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
        color: ct.purpleTint,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ct.purple, width: 0.5),
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
                color: ct.textPrimary)),
        Text(label,
            style: TextStyle(
                fontSize: 10, color: ct.purpleLight)),
      ],
    );
  }
}

class _BannerDivider extends StatelessWidget {
  const _BannerDivider();

  @override
  Widget build(BuildContext context) {
    return Container(width: 0.5, height: 40, color: ct.border);
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
        color: ct.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ct.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value,
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w500,
                  color: ct.textPrimary)),
          const SizedBox(height: 2),
          Text(label,
              style: TextStyle(
                  fontSize: 11, color: ct.textDisabled)),
          const SizedBox(height: 4),
          Text(delta,
              style:
                  TextStyle(fontSize: 11, color: ct.teal)),
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
                  ? ct.purpleTint
                  : ct.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: b.earned
                    ? ct.purple
                    : ct.border,
                width: 0.5,
              ),
            ),
            child: Column(
              children: [
                Text(b.emoji, style: const TextStyle(fontSize: 22)),
                const SizedBox(height: 4),
                Text(b.label,
                    style: TextStyle(
                        fontSize: 9, color: ct.purplePale)),
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
    final notifier  = ref.read(profileSettingsProvider.notifier);
    final isDark    = ref.watch(themeProvider) == ThemeMode.dark;
    return Container(
      decoration: BoxDecoration(
        color: ct.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ct.border, width: 0.5),
      ),
      child: Column(
        children: [
          _ToggleRow(
            iconBg:    ct.primaryTint,
            icon:      TablerIcons.moon_stars,
            iconColor: ct.primaryLight,
            label:     'Dark mode',
            value:     isDark,
            onChanged: (_) => ref.read(themeProvider.notifier).toggle(),
          ),
          _ToggleRow(
            iconBg:    ct.purpleTint,
            icon:      TablerIcons.bell,
            iconColor: ct.purpleLight,
            label:     'Notifications',
            value:     settings.notifications,
            onChanged: notifier.setNotifications,
          ),
          _ToggleRow(
            iconBg:    ct.tealTint,
            icon:      TablerIcons.moon,
            iconColor: ct.teal,
            label:     'Bedtime mode',
            value:     settings.bedtimeMode,
            onChanged: notifier.setBedtimeMode,
          ),
          _ArrowRow(
            iconBg:    ct.bgCard,
            icon:      TablerIcons.target,
            iconColor: ct.purplePale,
            label:     'Daily screen limit',
            value:     '${settings.dailyLimitHours} hr',
            onTap:     () => _showDailyLimitSheet(context, ref, settings.dailyLimitHours),
          ),
          _ArrowRow(
            iconBg:    ct.bgCard,
            icon:      TablerIcons.lock,
            iconColor: ct.purplePale,
            label:     'PIN lock',
            value:     settings.pinEnabled ? 'On' : 'Off',
            onTap:     () => _showPinLockSheet(context, ref, settings),
          ),
          _ArrowRow(
            iconBg:    ct.bgCard,
            icon:      TablerIcons.heart_handshake,
            iconColor: ct.pink,
            label:     'Accountability partner',
            value:     settings.accountabilityPartnerEmail ?? 'Add',
            isLast:    true,
            onTap:     () => _showAccountabilityPartnerSheet(context, ref, settings),
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
    this.onTap,
  });
  final Color       iconBg;
  final IconData    icon;
  final Color       iconColor;
  final String      label;
  final String      value;
  final bool        isLast;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return _SettingsRow(
      iconBg:    iconBg,
      icon:      icon,
      iconColor: iconColor,
      label:     label,
      isLast:    isLast,
      onTap:     onTap,
      trailing:  Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(value,
              style: TextStyle(
                  fontSize: 12, color: ct.textDisabled)),
          const SizedBox(width: 4),
          Icon(TablerIcons.chevron_right,
              size: 16, color: ct.border),
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
    this.onTap,
  });
  final Color       iconBg;
  final IconData    icon;
  final Color       iconColor;
  final String      label;
  final Widget      trailing;
  final bool        isLast;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final row = Container(
      decoration: BoxDecoration(
        border: isLast
            ? null
            : Border(
                bottom: BorderSide(
                    color: ct.borderFaint, width: 0.5)),
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
                style: TextStyle(
                    fontSize: 13, color: ct.textSecondary)),
          ),
          trailing,
        ],
      ),
    );
    if (onTap == null) return row;
    return InkWell(onTap: onTap, child: row);
  }
}

// ─── Settings sheets ─────────────────────────────────────────────────────────

void _showDailyLimitSheet(BuildContext context, WidgetRef ref, int currentHours) {
  showModalBottomSheet(
    context: context,
    backgroundColor: ct.bgCard,
    shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (sheetContext) {
      var hours = currentHours;
      return StatefulBuilder(builder: (sheetContext, setState) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Daily screen limit',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500,
                      color: ct.textPrimary)),
              const SizedBox(height: 16),
              Text('$hours hour${hours == 1 ? '' : 's'} / day',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w500,
                      color: ct.purpleLight)),
              Slider(
                value: hours.toDouble(),
                min: 1, max: 12, divisions: 11,
                activeColor: ct.purple,
                label: '$hours hr',
                onChanged: (v) => setState(() => hours = v.round()),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    ref.read(profileSettingsProvider.notifier).setDailyLimit(hours);
                    Navigator.of(sheetContext).pop();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ct.purple,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Save'),
                ),
              ),
            ],
          ),
        );
      });
    },
  );
}

void _showPinLockSheet(BuildContext context, WidgetRef ref, ProfileSettings settings) {
  final controller = TextEditingController();
  showModalBottomSheet(
    context: context,
    backgroundColor: ct.bgCard,
    shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (sheetContext) {
      return Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20,
            32 + MediaQuery.of(sheetContext).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('PIN lock',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500,
                    color: ct.textPrimary)),
            const SizedBox(height: 4),
            Text(
              settings.pinEnabled
                  ? 'PIN lock is on. Enter a new 4-digit PIN to change it, or turn it off below.'
                  : 'Set a 4-digit PIN to require it before changing block settings.',
              style: TextStyle(fontSize: 12, color: ct.textDisabled),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              maxLength: 4,
              obscureText: true,
              style: TextStyle(color: ct.textPrimary, fontSize: 20, letterSpacing: 8),
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                counterText: '',
                filled: true,
                fillColor: ct.bgSurface,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final pin = controller.text.trim();
                  if (pin.length != 4) return;
                  ref.read(profileSettingsProvider.notifier).setPin(pin);
                  Navigator.of(sheetContext).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: ct.purple,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Save PIN'),
              ),
            ),
            if (settings.pinEnabled) ...[
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    ref.read(profileSettingsProvider.notifier).clearPin();
                    Navigator.of(sheetContext).pop();
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: ct.red,
                    side: BorderSide(color: ct.redDark, width: 0.5),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Turn off PIN lock'),
                ),
              ),
            ],
          ],
        ),
      );
    },
  );
}

void _showAccountabilityPartnerSheet(
    BuildContext context, WidgetRef ref, ProfileSettings settings) {
  final controller = TextEditingController(text: settings.accountabilityPartnerEmail ?? '');
  showModalBottomSheet(
    context: context,
    backgroundColor: ct.bgCard,
    shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
    builder: (sheetContext) {
      return Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20,
            32 + MediaQuery.of(sheetContext).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Accountability partner',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500,
                    color: ct.textPrimary)),
            const SizedBox(height: 4),
            Text("We'll save their email so you can share your streak progress with them.",
                style: TextStyle(fontSize: 12, color: ct.textDisabled)),
            const SizedBox(height: 14),
            TextField(
              controller: controller,
              keyboardType: TextInputType.emailAddress,
              style: TextStyle(color: ct.textPrimary),
              decoration: InputDecoration(
                hintText: 'partner@example.com',
                hintStyle: TextStyle(color: ct.textDisabled),
                filled: true,
                fillColor: ct.bgSurface,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final email = controller.text.trim();
                  if (email.isEmpty) return;
                  ref.read(profileSettingsProvider.notifier).setAccountabilityPartner(email);
                  Navigator.of(sheetContext).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: ct.purple,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Save'),
              ),
            ),
            if (settings.accountabilityPartnerEmail != null) ...[
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    ref.read(profileSettingsProvider.notifier).removeAccountabilityPartner();
                    Navigator.of(sheetContext).pop();
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: ct.red,
                    side: BorderSide(color: ct.redDark, width: 0.5),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Remove partner'),
                ),
              ),
            ],
          ],
        ),
      );
    },
  );
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
          color: value ? ct.purple : ct.border,
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
              decoration: BoxDecoration(
                color: ct.textPrimary,
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
      onPressed: () async {
        try {
          await ref.read(authNotifierProvider.notifier).signOut();
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Signed out')),
            );
          }
        } catch (e) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Sign out failed: $e')),
            );
          }
        }
      },
      style: OutlinedButton.styleFrom(
        foregroundColor: ct.red,
        side: BorderSide(color: ct.redDark, width: 0.5),
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
        style: TextStyle(
            fontSize: 11,
            color: ct.textDisabled,
            letterSpacing: 0.8));
  }
}
