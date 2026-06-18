// lib/features/dashboard/presentation/screens/dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../block/application/block_settings_notifier.dart';
import '../../../block/data/block_model.dart';
import '../../application/streak_notifier.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final streakAsync = ref.watch(streakNotifierProvider);

    return Scaffold(
      backgroundColor: ct.bgSurface,
      body: SafeArea(
        child: streakAsync.when(
          loading: () => Center(
              child: CircularProgressIndicator(color: ct.purpleLight)),
          error: (e, _) =>
              Center(child: Text('Error: $e', style: TextStyle(color: ct.red))),
          data: (streak) => ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              _DashHeader(),
              const SizedBox(height: 14),
              _StreakCard(current: streak.currentStreak, best: streak.bestStreak),
              const SizedBox(height: 10),
              _WeekChart(data: streak.weeklyData),
              const SizedBox(height: 10),
              _StatRow(totalBlocks: streak.totalBlocksAllTime),
              const SizedBox(height: 10),
              _BlockedAppsCard(),
              const SizedBox(height: 10),
              _CheckInButton(checkedIn: streak.checkedInToday),
              const SizedBox(height: 10),
              _AINudge(streak: streak.currentStreak, blocks: streak.totalBlocksAllTime),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Header ──────────────────────────────────────────────────────────────────

class _DashHeader extends StatelessWidget {
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
              Text('Good morning,',
                  style: TextStyle(fontSize: 13, color: ct.textFaint)),
              SizedBox(height: 2),
              Text('Danny',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w500,
                      color: ct.textPrimary)),
            ],
          ),
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: ct.purpleDeep, shape: BoxShape.circle),
            child: Center(
              child: Text('DK', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
                  color: ct.purplePale)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Streak card ─────────────────────────────────────────────────────────────

class _StreakCard extends StatelessWidget {
  const _StreakCard({required this.current, required this.best});
  final int current, best;

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
              Text('$current',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w500,
                      color: ct.textPrimary)),
              const SizedBox(height: 1),
              Text('day streak', style: TextStyle(fontSize: 12, color: ct.textDisabled)),
            ],
          ),
          const Spacer(),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('$best',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500,
                      color: ct.purpleLight)),
              const SizedBox(height: 1),
              Text('best streak', style: TextStyle(fontSize: 11, color: ct.textDisabled)),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Week chart ──────────────────────────────────────────────────────────────

const _dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

class _WeekChart extends StatelessWidget {
  const _WeekChart({required this.data});
  final List<double> data;

  @override
  Widget build(BuildContext context) {
    final todayIndex = (DateTime.now().weekday - 1) % 7;
    return _ClarityCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('THIS WEEK',
              style: TextStyle(fontSize: 11, color: ct.textDisabled, letterSpacing: 0.8)),
          const SizedBox(height: 10),
          SizedBox(
            height: 56,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(7, (i) {
                final isToday = i == todayIndex;
                final height  = data.length > i ? data[i] : 0.0;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Flexible(
                          child: FractionallySizedBox(
                            heightFactor: height.clamp(0.05, 1.0),
                            alignment: Alignment.bottomCenter,
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 400),
                              curve: Curves.easeOut,
                              decoration: BoxDecoration(
                                color: isToday ? ct.purple : ct.tealDark,
                                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(_dayLabels[i],
                            style: TextStyle(fontSize: 9, color: ct.textDisabled)),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Stat row ────────────────────────────────────────────────────────────────

class _StatRow extends StatelessWidget {
  const _StatRow({required this.totalBlocks});
  final int totalBlocks;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
            child: _StatCard(value: '2h 14m', label: 'Screen time', delta: '↓ 45 min')),
        const SizedBox(width: 10),
        Expanded(child: _StatCard(value: '$totalBlocks', label: 'Urges blocked', delta: '↑ 3 today')),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.value, required this.label, required this.delta});
  final String value, label, delta;

  @override
  Widget build(BuildContext context) {
    return _ClarityCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w500,
              color: ct.textPrimary)),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(fontSize: 11, color: ct.textDisabled)),
          const SizedBox(height: 4),
          Text(delta, style: TextStyle(fontSize: 11, color: ct.teal)),
        ],
      ),
    );
  }
}

// ─── Blocked apps ─────────────────────────────────────────────────────────────

class _BlockedAppsCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(blockSettingsProvider);
    final apps = settingsAsync.maybeWhen(
      data: (s) => s.apps,
      orElse: () => const <AppEntry>[],
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: Text('BLOCKED APPS',
              style: TextStyle(fontSize: 11, color: ct.textDisabled, letterSpacing: 0.8)),
        ),
        Container(
          decoration: BoxDecoration(
            color: ct.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: ct.border, width: 0.5),
          ),
          child: apps.isEmpty
              ? Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  child: Text(
                    'No apps blocked yet. Add apps to block from the Block tab.',
                    style: TextStyle(fontSize: 13, color: ct.textDisabled),
                  ),
                )
              : Column(
                  children: apps.asMap().entries.map((e) {
                    final app    = e.value;
                    final isLast = e.key == apps.length - 1;
                    return Container(
                      decoration: BoxDecoration(
                        border: isLast ? null : Border(
                            bottom: BorderSide(color: ct.borderFaint, width: 0.5)),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          Text(app.emoji, style: const TextStyle(fontSize: 22)),
                          const SizedBox(width: 12),
                          Text(app.name, style: TextStyle(fontSize: 14,
                              fontWeight: FontWeight.w500, color: ct.textSecondary)),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: app.blocked
                                  ? ct.teal.withAlpha(34)
                                  : ct.amber.withAlpha(34),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              app.blocked ? 'Blocking' : 'Paused',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500,
                                  color: app.blocked ? ct.teal : ct.amber),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
        ),
      ],
    );
  }
}

// ─── Check-in button ─────────────────────────────────────────────────────────

class _CheckInButton extends ConsumerWidget {
  const _CheckInButton({required this.checkedIn});
  final bool checkedIn;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: double.infinity,
      decoration: BoxDecoration(
        color: checkedIn ? ct.tealTint : ct.purpleTint,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: checkedIn ? ct.tealDark : ct.purple,
          width: 0.5,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: checkedIn
              ? null
              : () => ref.read(streakNotifierProvider.notifier).checkIn(),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  checkedIn ? TablerIcons.circle_check : TablerIcons.circle_plus,
                  size: 20,
                  color: checkedIn ? ct.teal : ct.purpleLight,
                ),
                const SizedBox(width: 8),
                Text(
                  checkedIn ? 'Checked in today ✓' : 'Check in for today',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: checkedIn ? ct.teal : ct.purpleLight,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── AI nudge ────────────────────────────────────────────────────────────────

class _AINudge extends StatelessWidget {
  const _AINudge({required this.streak, required this.blocks});
  final int streak, blocks;

  String get _message {
    if (streak == 0)    return "Every journey starts with day one. You've got this.";
    if (streak < 3)     return "Two days in. The hardest part is already behind you.";
    if (streak < 7)     return "$streak days strong. Your brain is already rewiring.";
    if (streak < 14)    return "$streak days. That's real discipline. Keep the streak alive.";
    return "$streak days. You've blocked $blocks urges — that's real progress. Keep going.";
  }

  @override
  Widget build(BuildContext context) {
    return _ClarityCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(color: ct.purpleDeep, shape: BoxShape.circle),
            child: Icon(TablerIcons.sparkles, size: 16, color: ct.purplePale),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Productivity Max',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
                        color: ct.textSecondary)),
                const SizedBox(height: 4),
                Text(_message,
                    style: TextStyle(fontSize: 13, color: ct.textMuted, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Shared card ─────────────────────────────────────────────────────────────

class _ClarityCard extends StatelessWidget {
  const _ClarityCard({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ct.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ct.border, width: 0.5),
      ),
      child: child,
    );
  }
}
