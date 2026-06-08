// lib/features/profile/presentation/screens/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';

import '../../../../core/theme/app_theme.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ClarityColors.bgSurface,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          children: [
            const SizedBox(height: 16),
            _ProfileHero(),
            const SizedBox(height: 14),
            _StreakBanner(),
            const SizedBox(height: 14),
            const _SectionLabel('LIFETIME STATS'),
            const SizedBox(height: 8),
            _StatsGrid(),
            const SizedBox(height: 14),
            const _SectionLabel('BADGES'),
            const SizedBox(height: 8),
            _BadgesRow(),
            const SizedBox(height: 14),
            const _SectionLabel('SETTINGS'),
            const SizedBox(height: 8),
            _SettingsCard(),
            const SizedBox(height: 14),
            _SignOutButton(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

class _ProfileHero extends StatelessWidget {
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
              child: const Center(
                child: Text('DK',
                    style: TextStyle(
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
        const Text('Danny Kay',
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: ClarityColors.textPrimary)),
        const SizedBox(height: 2),
        const Text('@dannyk · joined June 2025',
            style: TextStyle(fontSize: 13, color: ClarityColors.textDisabled)),
      ],
    );
  }
}

// ─── Streak banner ───────────────────────────────────────────────────────────

class _StreakBanner extends StatelessWidget {
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
        children: const [
          _BannerStat(value: '14', label: 'day streak 🔥', large: true),
          _BannerDivider(),
          _BannerStat(value: '21', label: 'best streak'),
          _BannerDivider(),
          _BannerStat(value: '312', label: 'blocks total'),
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
    return Container(
      width: 0.5,
      height: 40,
      color: ClarityColors.border,
    );
  }
}

// ─── Stats grid ───────────────────────────────────────────────────────────────

class _StatsGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.5,
      children: const [
        _StatCard(value: '47h', label: 'Screen time saved', delta: '≈ 2 days back'),
        _StatCard(value: '312', label: 'Urges blocked',     delta: '↑ 18 this week'),
        _StatCard(value: '28',  label: 'Check-ins logged',  delta: '14 day streak'),
        _StatCard(value: '9',   label: 'People supported',  delta: 'in community'),
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
              style: const TextStyle(
                  fontSize: 11, color: ClarityColors.teal)),
        ],
      ),
    );
  }
}

// ─── Badges ──────────────────────────────────────────────────────────────────

class _BadgesRow extends StatelessWidget {
  static const _badges = [
    ('🌱', 'First week',  true),
    ('🔥', '14 days',     true),
    ('🛡️', '100 blocks',  true),
    ('💎', '30 days',     false),
    ('🏆', '60 days',     false),
  ];

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _badges.map((b) {
        final earned = b.$3;
        return Opacity(
          opacity: earned ? 1.0 : 0.4,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: earned ? ClarityColors.purpleTint : ClarityColors.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: earned ? ClarityColors.purple : ClarityColors.border,
                width: 0.5,
              ),
            ),
            child: Column(
              children: [
                Text(b.$1, style: const TextStyle(fontSize: 22)),
                const SizedBox(height: 4),
                Text(b.$2,
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

class _SettingsCard extends StatefulWidget {
  @override
  State<_SettingsCard> createState() => _SettingsCardState();
}

class _SettingsCardState extends State<_SettingsCard> {
  bool _notifications = true;
  bool _bedtime       = true;
  bool _anonymous     = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ClarityColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ClarityColors.border, width: 0.5),
      ),
      child: Column(
        children: [
          _ToggleRow(
            iconBg:   ClarityColors.purpleTint,
            icon:     TablerIcons.bell,
            iconColor: ClarityColors.purpleLight,
            label:    'Notifications',
            value:    _notifications,
            onChanged: (v) => setState(() => _notifications = v),
          ),
          _ToggleRow(
            iconBg:    ClarityColors.tealTint,
            icon:      TablerIcons.moon,
            iconColor: ClarityColors.teal,
            label:     'Bedtime mode',
            value:     _bedtime,
            onChanged: (v) => setState(() => _bedtime = v),
          ),
          _ToggleRow(
            iconBg:    ClarityColors.amberTint,
            icon:      TablerIcons.user_circle,
            iconColor: ClarityColors.amber,
            label:     'Anonymous mode',
            value:     _anonymous,
            onChanged: (v) => setState(() => _anonymous = v),
            isLast:    false,
          ),
          _ArrowRow(
            iconBg:    ClarityColors.bgCard,
            icon:      TablerIcons.target,
            iconColor: ClarityColors.purplePale,
            label:     'Daily screen limit',
            value:     '2 hr',
          ),
          _ArrowRow(
            iconBg:    ClarityColors.bgCard,
            icon:      TablerIcons.lock,
            iconColor: ClarityColors.purplePale,
            label:     'PIN lock',
            value:     'Off',
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
  final Color            iconBg;
  final IconData         icon;
  final Color            iconColor;
  final String           label;
  final bool             value;
  final ValueChanged<bool> onChanged;
  final bool             isLast;

  @override
  Widget build(BuildContext context) {
    return _SettingsRow(
      iconBg: iconBg,
      icon: icon,
      iconColor: iconColor,
      label: label,
      isLast: isLast,
      trailing: _MiniSwitch(value: value, onChanged: onChanged),
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
      iconBg: iconBg,
      icon: icon,
      iconColor: iconColor,
      label: label,
      isLast: isLast,
      trailing: Row(
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
  final bool             value;
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
          alignment:
              value ? Alignment.centerRight : Alignment.centerLeft,
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

class _SignOutButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: () {},
      style: OutlinedButton.styleFrom(
        foregroundColor: ClarityColors.red,
        side: const BorderSide(color: ClarityColors.redDark, width: 0.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
