// lib/features/block/presentation/screens/block_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:go_router/go_router.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../paywall/presentation/widgets/premium_gate.dart';
import '../../../permissions/application/permissions_provider.dart';
import '../../application/block_settings_notifier.dart';
import '../../data/block_model.dart';

class BlockScreen extends ConsumerStatefulWidget {
  const BlockScreen({super.key});

  @override
  ConsumerState<BlockScreen> createState() => _BlockScreenState();
}

class _BlockScreenState extends ConsumerState<BlockScreen> {
  int _tab = 0;
  final TextEditingController _kwController = TextEditingController();

  @override
  void dispose() {
    _kwController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(blockSettingsProvider);
    final perms = ref.watch(permissionsProvider);

    return Scaffold(
      backgroundColor: ct.bgSurface,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text('Block Setup',
                        style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w500,
                            color: ct.textPrimary)),
                  ),
                  IconButton(
                    icon: Icon(TablerIcons.plus,
                        color: ct.purpleLight),
                    onPressed: () {},
                  ),
                ],
              ),
            ),

            // ── Permissions setup banner (Android only, dismisses once all granted) ──
            if (!kIsWeb && !perms.isChecking && !perms.allGranted)
              _SetupBanner(
                grantedCount: perms.grantedCount,
                onTap: () => context.push(Routes.permissions),
              ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _SegmentControl(
                labels: const ['Apps & Sites', 'Keywords'],
                current: _tab,
                onChanged: (i) => setState(() => _tab = i),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: async.when(
                loading: () => Center(
                    child: CircularProgressIndicator(
                        color: ct.purpleLight)),
                error: (e, _) => Center(
                    child: Text('Error: $e',
                        style: TextStyle(
                            color: ct.textDisabled))),
                data: (settings) => ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: _tab == 0
                      ? [
                          _AppsList(
                            apps: settings.apps,
                            onToggle: (i) => ref
                                .read(blockSettingsProvider.notifier)
                                .toggleApp(i),
                          ),
                          const SizedBox(height: 10),
                          _ScheduleCard(
                            activeDays: settings.activeDays,
                            onToggleDay: (i) => ref
                                .read(blockSettingsProvider.notifier)
                                .toggleDay(i),
                            scheduleStart: settings.scheduleStart,
                            scheduleEnd: settings.scheduleEnd,
                          ),
                          const SizedBox(height: 10),
                          _StrictnessCard(
                            current: settings.strictness,
                            onSelect: (i) => ref
                                .read(blockSettingsProvider.notifier)
                                .setStrictness(i),
                          ),
                          const SizedBox(height: 10),
                          const _SavedIndicator(),
                          const SizedBox(height: 20),
                        ]
                      : [
                          PremiumGate(
                            feature: 'Keyword Blocking',
                            description: 'Block content by keyword across all apps and browsers.',
                            child: _KeywordsPanel(
                              keywords: settings.keywords,
                              controller: _kwController,
                              onAdd: () {
                                ref
                                    .read(blockSettingsProvider.notifier)
                                    .addKeyword(_kwController.text);
                                _kwController.clear();
                              },
                              onRemove: (i) => ref
                                  .read(blockSettingsProvider.notifier)
                                  .removeKeyword(i),
                            ),
                          ),
                          const SizedBox(height: 10),
                          const _SavedIndicator(),
                          const SizedBox(height: 20),
                        ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Apps list ───────────────────────────────────────────────────────────────

class _AppsList extends StatelessWidget {
  const _AppsList({required this.apps, required this.onToggle});
  final List<AppEntry>    apps;
  final ValueChanged<int> onToggle;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ct.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ct.border, width: 0.5),
      ),
      child: Column(
        children: apps.asMap().entries.map((e) {
          final i   = e.key;
          final app = e.value;
          return _AppRow(
              app: app,
              isLast: i == apps.length - 1,
              onToggle: () => onToggle(i));
        }).toList(),
      ),
    );
  }
}

class _AppRow extends StatelessWidget {
  const _AppRow(
      {required this.app, required this.isLast, required this.onToggle});
  final AppEntry     app;
  final bool         isLast;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onToggle,
      child: Container(
        decoration: BoxDecoration(
          border: isLast
              ? null
              : Border(
                  bottom: BorderSide(
                      color: ct.borderFaint, width: 0.5)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Text(app.emoji, style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(app.name,
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: ct.textSecondary)),
                  Text(app.category,
                      style: TextStyle(
                          fontSize: 11, color: ct.textDisabled)),
                ],
              ),
            ),
            _ClaritySwitch(value: app.blocked, onChanged: (_) => onToggle()),
          ],
        ),
      ),
    );
  }
}

// ─── Schedule card ───────────────────────────────────────────────────────────

class _ScheduleCard extends StatelessWidget {
  const _ScheduleCard({
    required this.activeDays,
    required this.onToggleDay,
    required this.scheduleStart,
    required this.scheduleEnd,
  });

  final List<bool>     activeDays;
  final ValueChanged<int> onToggleDay;
  final String         scheduleStart;
  final String         scheduleEnd;

  static const _dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
        children: [
          Text('SCHEDULE',
              style: TextStyle(
                  fontSize: 11,
                  color: ct.textDisabled,
                  letterSpacing: 0.8)),
          const SizedBox(height: 10),
          Row(
            children: [
              _TimePill(label: scheduleStart),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: Text('to',
                    style: TextStyle(
                        fontSize: 12, color: ct.textDisabled)),
              ),
              _TimePill(label: scheduleEnd),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: _dayLabels.asMap().entries.map((e) {
              final i  = e.key;
              final on = activeDays[i];
              return Expanded(
                child: GestureDetector(
                  onTap: () => onToggleDay(i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    padding: const EdgeInsets.symmetric(vertical: 7),
                    decoration: BoxDecoration(
                      color: on
                          ? ct.purple
                          : ct.bgElevated,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      e.value,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: on
                            ? ct.textPrimary
                            : ct.textDisabled,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _TimePill extends StatelessWidget {
  const _TimePill({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: ct.bgElevated,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ct.border, width: 0.5),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: ct.purpleLight)),
    );
  }
}

// ─── Strictness card ─────────────────────────────────────────────────────────

class _StrictnessCard extends StatelessWidget {
  const _StrictnessCard({required this.current, required this.onSelect});
  final int               current;
  final ValueChanged<int> onSelect;

  static const _opts = [
    _StrictOpt(icon: TablerIcons.bell_off, label: 'Soft\nRemind only'),
    _StrictOpt(icon: TablerIcons.shield,   label: 'Standard\nBlock + remind'),
    _StrictOpt(icon: TablerIcons.lock,     label: 'Strict\nNo override'),
  ];

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
        children: [
          Text('STRICTNESS',
              style: TextStyle(
                  fontSize: 11,
                  color: ct.textDisabled,
                  letterSpacing: 0.8)),
          const SizedBox(height: 10),
          Row(
            children: _opts.asMap().entries.map((e) {
              final i   = e.key;
              final opt = e.value;
              final sel = i == current;
              final tile = Expanded(
                child: GestureDetector(
                  onTap: () => onSelect(i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: EdgeInsets.only(left: i == 0 ? 0 : 6),
                    padding: const EdgeInsets.symmetric(
                        vertical: 10, horizontal: 6),
                    decoration: BoxDecoration(
                      color: sel
                          ? ct.purpleTint
                          : ct.bgElevated,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color:
                            sel ? ct.purple : ct.border,
                        width: 0.5,
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(opt.icon,
                            size: 20,
                            color: sel
                                ? ct.purpleLight
                                : ct.textDisabled),
                        const SizedBox(height: 5),
                        Text(
                          opt.label,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 10,
                            color: sel
                                ? ct.purplePale
                                : ct.textDisabled,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
              if (i == 2) {
                return Expanded(
                  child: PremiumGate(
                    feature: 'Strict Mode',
                    description: 'No override — prevents bypassing blocks entirely.',
                    child: GestureDetector(
                      onTap: () => onSelect(i),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.only(left: 6),
                        padding: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 6),
                        decoration: BoxDecoration(
                          color: sel
                              ? ct.purpleTint
                              : ct.bgElevated,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: sel
                                ? ct.purple
                                : ct.border,
                            width: 0.5,
                          ),
                        ),
                        child: Column(
                          children: [
                            Icon(opt.icon,
                                size: 20,
                                color: sel
                                    ? ct.purpleLight
                                    : ct.textDisabled),
                            const SizedBox(height: 5),
                            Text(
                              opt.label,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 10,
                                color: sel
                                    ? ct.purplePale
                                    : ct.textDisabled,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }
              return tile;
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _StrictOpt {
  const _StrictOpt({required this.icon, required this.label});
  final IconData icon;
  final String   label;
}

// ─── Keywords panel ──────────────────────────────────────────────────────────

class _KeywordsPanel extends StatelessWidget {
  const _KeywordsPanel({
    required this.keywords,
    required this.controller,
    required this.onAdd,
    required this.onRemove,
  });
  final List<String>          keywords;
  final TextEditingController controller;
  final VoidCallback          onAdd;
  final ValueChanged<int>     onRemove;

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
        children: [
          Wrap(
            spacing: 7,
            runSpacing: 7,
            children: keywords.asMap().entries.map((e) {
              return GestureDetector(
                onTap: () => onRemove(e.key),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B1528),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: const Color(0xFF72243E), width: 0.5),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(TablerIcons.x,
                          size: 12, color: ct.pink),
                      const SizedBox(width: 5),
                      Text(e.value,
                          style: TextStyle(
                              fontSize: 12, color: ct.pink)),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  style: TextStyle(
                      color: ct.textSecondary, fontSize: 13),
                  decoration:
                      const InputDecoration(hintText: 'Add keyword…'),
                  onSubmitted: (_) => onAdd(),
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: onAdd,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: ct.purple,
                    borderRadius: BorderRadius.circular(9),
                  ),
                  child: Text('Add',
                      style: TextStyle(
                          fontSize: 13,
                          color: ct.textPrimary)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Setup banner ─────────────────────────────────────────────────────────────

class _SetupBanner extends StatelessWidget {
  const _SetupBanner({required this.grantedCount, required this.onTap});
  final int          grantedCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: ct.purpleTint,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: ct.purple, width: 0.5),
        ),
        child: Row(
          children: [
            Icon(TablerIcons.shield_exclamation,
                size: 18, color: ct.purpleLight),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Blocking not active — $grantedCount/3 permissions granted. Tap to set up.',
                style: TextStyle(
                    fontSize: 12, color: ct.purplePale),
              ),
            ),
            Icon(TablerIcons.chevron_right,
                size: 16, color: ct.purpleLight),
          ],
        ),
      ),
    );
  }
}

// ─── Saved indicator (replaces old Save button — changes auto-persist) ────────

class _SavedIndicator extends StatelessWidget {
  const _SavedIndicator();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(TablerIcons.circle_check,
            size: 14, color: ct.teal),
        SizedBox(width: 6),
        Text('Changes saved automatically',
            style:
                TextStyle(fontSize: 12, color: ct.textDisabled)),
      ],
    );
  }
}

// ─── Shared widgets ───────────────────────────────────────────────────────────

class _SegmentControl extends StatelessWidget {
  const _SegmentControl(
      {required this.labels, required this.current, required this.onChanged});
  final List<String>      labels;
  final int               current;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: ct.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ct.border, width: 0.5),
      ),
      child: Row(
        children: labels.asMap().entries.map((e) {
          final i   = e.key;
          final sel = i == current;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: sel ? ct.purple : Colors.transparent,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Text(
                  e.value,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: sel
                        ? ct.textPrimary
                        : ct.textDisabled,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _ClaritySwitch extends StatelessWidget {
  const _ClaritySwitch({required this.value, required this.onChanged});
  final bool               value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        width: 44,
        height: 26,
        decoration: BoxDecoration(
          color: value ? ct.purple : ct.border,
          borderRadius: BorderRadius.circular(13),
        ),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 250),
          alignment: value ? Alignment.centerRight : Alignment.centerLeft,
          child: Padding(
            padding: const EdgeInsets.all(3),
            child: Container(
              width: 20,
              height: 20,
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
