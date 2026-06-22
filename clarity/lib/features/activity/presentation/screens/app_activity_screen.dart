// lib/features/activity/presentation/screens/app_activity_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../application/activity_provider.dart';
import '../../domain/activity_metric.dart';

class AppActivityScreen extends ConsumerWidget {
  const AppActivityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metric = ref.watch(selectedMetricProvider);

    return Scaffold(
      backgroundColor: ct.bgSurface,
      appBar: AppBar(
        backgroundColor: ct.bgSurface,
        elevation: 0,
        title: Text('App activity details',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w500, color: ct.textPrimary)),
        iconTheme: IconThemeData(color: ct.textPrimary),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          children: [
            const SizedBox(height: 8),
            const _MetricSelector(),
            const SizedBox(height: 16),
            const _TotalHeader(),
            const SizedBox(height: 16),
            const _WeeklyChartCard(),
            const SizedBox(height: 16),
            const _DayNavigator(),
            const SizedBox(height: 10),
            _AppBreakdownList(metric: metric),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

// ─── Metric selector ─────────────────────────────────────────────────────────

class _MetricSelector extends ConsumerWidget {
  const _MetricSelector();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metric = ref.watch(selectedMetricProvider);

    return PopupMenuButton<ActivityMetric>(
      initialValue: metric,
      color: ct.bgCard,
      onSelected: (m) => ref.read(selectedMetricProvider.notifier).state = m,
      itemBuilder: (context) => ActivityMetric.values.map((m) {
        return PopupMenuItem(
          value: m,
          child: Text(m.label, style: TextStyle(color: ct.textPrimary)),
        );
      }).toList(),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(metric.label,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: ct.textPrimary)),
          const SizedBox(width: 4),
          Icon(TablerIcons.chevron_down, size: 18, color: ct.textPrimary),
        ],
      ),
    );
  }
}

// ─── Total header ────────────────────────────────────────────────────────────

class _TotalHeader extends ConsumerWidget {
  const _TotalHeader();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metric = ref.watch(selectedMetricProvider);
    final totalAsync = ref.watch(activityTotalTodayProvider);

    return totalAsync.when(
      loading: () => SizedBox(
          height: 56, child: Center(child: CircularProgressIndicator(color: ct.purpleLight))),
      error: (e, _) => Text('Error: $e', style: TextStyle(color: ct.red)),
      data: (total) {
        final (value, unit) = switch (metric) {
          ActivityMetric.screenTime =>
            ('${total ~/ 60}h ${total % 60}m', ''),
          ActivityMetric.notifications => ('$total', 'notifications'),
          ActivityMetric.opens => ('$total', 'unlocks'),
        };
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(value,
                    style: TextStyle(
                        fontSize: 34, fontWeight: FontWeight.w600, color: ct.textPrimary)),
                if (unit.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Text(unit, style: TextStyle(fontSize: 14, color: ct.textDisabled)),
                ],
              ],
            ),
            const SizedBox(height: 2),
            Text('Today', style: TextStyle(fontSize: 13, color: ct.textDisabled)),
          ],
        );
      },
    );
  }
}

// ─── Weekly chart ────────────────────────────────────────────────────────────

const _sunToSatLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

class _WeeklyChartCard extends ConsumerWidget {
  const _WeeklyChartCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weeklyAsync = ref.watch(activityWeeklyTotalsProvider);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ct.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ct.border, width: 0.5),
      ),
      child: weeklyAsync.when(
        loading: () => const SizedBox(height: 90),
        error: (e, _) => Text('Error: $e', style: TextStyle(color: ct.red)),
        data: (totals) {
          final maxVal = totals.fold<int>(1, (m, t) => t.value > m ? t.value : m);
          final today = DateTime.now();

          return SizedBox(
            height: 90,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(7, (i) {
                final total = totals.length > i ? totals[i] : null;
                final value = total?.value ?? 0;
                final heightFactor = (value / maxVal).clamp(0.04, 1.0);
                final isToday = total != null &&
                    total.date.year == today.year &&
                    total.date.month == today.month &&
                    total.date.day == today.day;

                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Flexible(
                          child: FractionallySizedBox(
                            heightFactor: heightFactor,
                            alignment: Alignment.bottomCenter,
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 400),
                              curve: Curves.easeOut,
                              decoration: BoxDecoration(
                                color: isToday ? ct.purple : ct.tealDark,
                                borderRadius:
                                    const BorderRadius.vertical(top: Radius.circular(4)),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(_sunToSatLabels[i],
                            style: TextStyle(fontSize: 10, color: ct.textDisabled)),
                      ],
                    ),
                  ),
                );
              }),
            ),
          );
        },
      ),
    );
  }
}

// ─── Day navigator ───────────────────────────────────────────────────────────

class _DayNavigator extends ConsumerWidget {
  const _DayNavigator();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final day = ref.watch(selectedDayProvider);
    final today = DateTime.now();
    final isToday = day.year == today.year && day.month == today.month && day.day == today.day;
    final label = isToday ? 'Today' : DateFormat('EEE, MMM d').format(day);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          icon: Icon(TablerIcons.chevron_left, color: ct.textPrimary),
          onPressed: () => ref.read(selectedDayProvider.notifier).state =
              day.subtract(const Duration(days: 1)),
        ),
        Text(label,
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: ct.textPrimary)),
        IconButton(
          icon: Icon(TablerIcons.chevron_right,
              color: isToday ? ct.textDisabled : ct.textPrimary),
          onPressed: isToday
              ? null
              : () =>
                  ref.read(selectedDayProvider.notifier).state = day.add(const Duration(days: 1)),
        ),
      ],
    );
  }
}

// ─── Per-app breakdown ───────────────────────────────────────────────────────

class _AppBreakdownList extends ConsumerWidget {
  const _AppBreakdownList({required this.metric});
  final ActivityMetric metric;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final breakdownAsync = ref.watch(activityBreakdownProvider);

    return breakdownAsync.when(
      loading: () => Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator(color: ct.purpleLight)),
      ),
      error: (e, _) => Text('Error: $e', style: TextStyle(color: ct.red)),
      data: (entries) {
        if (entries.isEmpty) {
          return Container(
            decoration: BoxDecoration(
              color: ct.bgCard,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: ct.border, width: 0.5),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Text(
              'No activity recorded yet for this day.',
              style: TextStyle(fontSize: 13, color: ct.textDisabled),
            ),
          );
        }

        return Container(
          decoration: BoxDecoration(
            color: ct.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: ct.border, width: 0.5),
          ),
          child: Column(
            children: entries.asMap().entries.map((e) {
              final entry = e.value;
              final isLast = e.key == entries.length - 1;
              return Container(
                decoration: BoxDecoration(
                  border:
                      isLast ? null : Border(bottom: BorderSide(color: ct.borderFaint, width: 0.5)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(color: ct.purpleDeep, shape: BoxShape.circle),
                      child: Center(
                        child: Text(
                          entry.appName.isNotEmpty ? entry.appName[0].toUpperCase() : '?',
                          style: TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w500, color: ct.purplePale),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(entry.appName,
                          style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w500, color: ct.textSecondary),
                          overflow: TextOverflow.ellipsis),
                    ),
                    Text(_formatValue(metric, entry.value),
                        style: TextStyle(fontSize: 13, color: ct.textDisabled)),
                  ],
                ),
              );
            }).toList(),
          ),
        );
      },
    );
  }

  String _formatValue(ActivityMetric metric, int value) {
    switch (metric) {
      case ActivityMetric.screenTime:
        if (value < 1) return '<1 min';
        final h = value ~/ 60;
        final m = value % 60;
        return h > 0 ? '${h}h ${m}m' : '${m}min';
      case ActivityMetric.notifications:
        return '$value';
      case ActivityMetric.opens:
        return '$value';
    }
  }
}
