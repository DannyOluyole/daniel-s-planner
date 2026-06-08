// lib/features/dashboard/presentation/screens/dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/dashboard_model.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(dashboardProvider);
    return Scaffold(
      backgroundColor: ClarityColors.bgSurface,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
          children: [
            _DashHeader(name: stats.userName, initials: stats.userInitials),
            const SizedBox(height: 14),
            _StreakCard(streak: stats.streakDays, best: stats.bestStreak),
            const SizedBox(height: 10),
            _WeekChart(data: stats.weekData),
            const SizedBox(height: 10),
            _StatRow(
              screenTime: stats.screenTimeToday,
              screenTimeDelta: stats.screenTimeDelta,
              urges: stats.urgesBlocked,
              urgesDelta: stats.urgesDelta,
            ),
            const SizedBox(height: 10),
            _BlockedAppsCard(),
            const SizedBox(height: 10),
            _AINudge(message: stats.aiNudge),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

// ─── Header ──────────────────────────────────────────────────────────────────

class _DashHeader extends StatelessWidget {
  const _DashHeader({required this.name, required this.initials});
  final String name;
  final String initials;

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_greeting,
                  style: const TextStyle(fontSize: 13, color: ClarityColors.textFaint)),
              const SizedBox(height: 2),
              Text(name,
                  style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w500,
                      color: ClarityColors.textPrimary)),
            ],
          ),
          Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(
              color: ClarityColors.purpleDeep,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(initials,
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: ClarityColors.purplePale)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Streak card ─────────────────────────────────────────────────────────────

class _StreakCard extends StatelessWidget {
  const _StreakCard({required this.streak, required this.best});
  final int streak;
  final int best;

  @override
  Widget build(BuildContext context) {
    return _ClarityCard(
      child: Row(
        children: [
          const Text('🔥', style: TextStyle(fontSize: 28)),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('$streak',
                  style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w500,
                      color: ClarityColors.textPrimary)),
              const SizedBox(height: 1),
              const Text('day streak',
                  style: TextStyle(
                      fontSize: 12, color: ClarityColors.textDisabled)),
            ],
          ),
          const Spacer(),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('$best',
                  style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: ClarityColors.purpleLight)),
              const SizedBox(height: 1),
              const Text('best streak',
                  style: TextStyle(
                      fontSize: 11, color: ClarityColors.textDisabled)),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Week chart ──────────────────────────────────────────────────────────────

class _WeekChart extends StatelessWidget {
  const _WeekChart({required this.data});
  final List<DayUsage> data;

  @override
  Widget build(BuildContext context) {
    return _ClarityCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('THIS WEEK',
              style: TextStyle(
                  fontSize: 11,
                  color: ClarityColors.textDisabled,
                  letterSpacing: 0.8)),
          const SizedBox(height: 10),
          SizedBox(
            height: 56,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: data.map((d) {
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Flexible(
                          child: FractionallySizedBox(
                            heightFactor: d.fraction,
                            alignment: Alignment.bottomCenter,
                            child: Container(
                              decoration: BoxDecoration(
                                color: d.isToday
                                    ? ClarityColors.purple
                                    : ClarityColors.tealDark,
                                borderRadius: const BorderRadius.vertical(
                                    top: Radius.circular(4)),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(d.label,
                            style: const TextStyle(
                                fontSize: 9,
                                color: ClarityColors.textDisabled)),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Stat row ────────────────────────────────────────────────────────────────

class _StatRow extends StatelessWidget {
  const _StatRow({
    required this.screenTime,
    required this.screenTimeDelta,
    required this.urges,
    required this.urgesDelta,
  });
  final String screenTime;
  final String screenTimeDelta;
  final int    urges;
  final String urgesDelta;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _StatCard(value: screenTime, label: 'Screen time', delta: screenTimeDelta)),
        const SizedBox(width: 10),
        Expanded(child: _StatCard(value: '$urges', label: 'Urges blocked', delta: urgesDelta)),
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
    return _ClarityCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
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
              style: const TextStyle(fontSize: 11, color: ClarityColors.teal)),
        ],
      ),
    );
  }
}

// ─── Blocked apps ─────────────────────────────────────────────────────────────

class _BlockedApp {
  const _BlockedApp(
      {required this.emoji, required this.name, required this.isBlocking});
  final String emoji;
  final String name;
  final bool   isBlocking;
}

const _blockedApps = [
  _BlockedApp(emoji: '📱', name: 'TikTok',    isBlocking: true),
  _BlockedApp(emoji: '📸', name: 'Instagram', isBlocking: true),
  _BlockedApp(emoji: '👽', name: 'Reddit',    isBlocking: false),
];

class _BlockedAppsCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: Text('BLOCKED APPS',
              style: TextStyle(
                  fontSize: 11,
                  color: ClarityColors.textDisabled,
                  letterSpacing: 0.8)),
        ),
        Container(
          decoration: BoxDecoration(
            color: ClarityColors.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: ClarityColors.border, width: 0.5),
          ),
          child: Column(
            children: _blockedApps.asMap().entries.map((e) {
              final i   = e.key;
              final app = e.value;
              final isLast = i == _blockedApps.length - 1;
              return _BlockedRow(app: app, isLast: isLast);
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _BlockedRow extends StatelessWidget {
  const _BlockedRow({required this.app, required this.isLast});
  final _BlockedApp app;
  final bool        isLast;

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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Text(app.emoji, style: const TextStyle(fontSize: 22)),
          const SizedBox(width: 12),
          Text(app.name,
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: ClarityColors.textSecondary)),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: app.isBlocking
                  ? ClarityColors.teal.withAlpha(34)
                  : ClarityColors.amber.withAlpha(34),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              app.isBlocking ? 'Blocking' : 'Paused',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: app.isBlocking
                    ? ClarityColors.teal
                    : ClarityColors.amber,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── AI nudge bubble ─────────────────────────────────────────────────────────

class _AINudge extends StatelessWidget {
  const _AINudge({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return _ClarityCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              color: ClarityColors.purpleDeep,
              shape: BoxShape.circle,
            ),
            child: const Icon(TablerIcons.sparkles,
                size: 16, color: ClarityColors.purplePale),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Clarity',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: ClarityColors.textSecondary)),
                const SizedBox(height: 4),
                Text(
                  message,
                  style: const TextStyle(
                      fontSize: 13,
                      color: ClarityColors.textMuted,
                      height: 1.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Shared card widget ───────────────────────────────────────────────────────

class _ClarityCard extends StatelessWidget {
  const _ClarityCard({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ClarityColors.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ClarityColors.border, width: 0.5),
      ),
      child: child,
    );
  }
}
