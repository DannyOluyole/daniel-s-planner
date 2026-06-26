// lib/features/block/presentation/screens/block_screen.dart
import 'dart:convert';
import 'dart:typed_data';

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
import '../../application/location_rules_notifier.dart';
import '../../data/block_model.dart';
import '../../data/location_rule.dart';
import '../../platform/blocking_channel.dart';
import '../../../profile/application/profile_notifier.dart';

class BlockScreen extends ConsumerStatefulWidget {
  const BlockScreen({super.key});

  @override
  ConsumerState<BlockScreen> createState() => _BlockScreenState();
}

class _BlockScreenState extends ConsumerState<BlockScreen> {
  int _tab = 0;
  int _statusFilter = 1; // 0 = Unlocked, 1 = Locked
  String _query = '';
  final TextEditingController _kwController = TextEditingController();
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _kwController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _showAddAppSheet(BuildContext context, WidgetRef ref, List<AppEntry> existing) {
    final existingPackages = existing.map((a) => a.packageName).whereType<String>().toSet();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _AddAppSheet(
        existingPackages: existingPackages,
        onAddInstalled: (name, pkg) {
          ref.read(blockSettingsProvider.notifier).addApp(
                name: name,
                emoji: '📱',
                category: 'App',
                packageName: pkg,
              );
        },
        onAddManual: (name) {
          ref.read(blockSettingsProvider.notifier).addApp(
                name: name,
                emoji: '🔒',
                category: 'Custom',
              );
        },
      ),
    );
  }

  void _showAddLocationSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _AddLocationSheet(
        onSave: (name, lat, lng, radius, pkgs, appNames) {
          ref.read(locationRulesProvider.notifier).addRule(
            name: name, lat: lat, lng: lng,
            radiusMeters: radius,
            packageNames: pkgs,
            appNames: appNames,
          );
        },
      ),
    );
  }

  // Shows a PIN-entry dialog when PIN lock is enabled, and returns true if the
  // user is allowed to proceed (PIN disabled, or correct PIN entered).
  Future<bool> _verifyPin(BuildContext context, WidgetRef ref) async {
    final profile = ref.read(profileSettingsProvider).valueOrNull;
    if (profile == null || !profile.pinEnabled || profile.pinCode == null) {
      return true;
    }

    final controller = TextEditingController();
    var error = false;

    final ok = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) => AlertDialog(
          backgroundColor: ct.bgCard,
          title: Text('Enter PIN', style: TextStyle(color: ct.textPrimary)),
          content: TextField(
            controller: controller,
            autofocus: true,
            obscureText: true,
            keyboardType: TextInputType.number,
            maxLength: 4,
            style: TextStyle(color: ct.textPrimary),
            decoration: InputDecoration(
              errorText: error ? 'Incorrect PIN' : null,
              counterText: '',
            ),
            onSubmitted: (_) {
              if (controller.text == profile.pinCode) {
                Navigator.of(dialogContext).pop(true);
              } else {
                setDialogState(() => error = true);
              }
            },
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                if (controller.text == profile.pinCode) {
                  Navigator.of(dialogContext).pop(true);
                } else {
                  setDialogState(() => error = true);
                }
              },
              child: const Text('Unlock'),
            ),
          ],
        ),
      ),
    );

    return ok ?? false;
  }

  void _showLimitsSheet(BuildContext context, WidgetRef ref, int index, AppEntry app) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _AppLimitsSheet(
        app: app,
        onSave: (openLimit, timeLimit) {
          ref.read(blockSettingsProvider.notifier).setAppLimits(
                index,
                openLimitPerDay: openLimit,
                clearOpenLimit: openLimit == null,
                timeLimitMinutes: timeLimit,
                clearTimeLimit: timeLimit == null,
              );
        },
      ),
    );
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
            _SecureHeader(
              lockedCount: async.valueOrNull?.apps.where((a) => a.blocked).length ?? 0,
              totalCount: async.valueOrNull?.apps.length ?? 0,
              onAdd: () => _showAddAppSheet(
                  context, ref, async.valueOrNull?.apps ?? const []),
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
                data: (settings) {
                  final filteredApps = settings.apps.where((a) {
                    final matchesQuery =
                        _query.isEmpty || a.name.toLowerCase().contains(_query.toLowerCase());
                    final matchesStatus = _statusFilter == 1 ? a.blocked : !a.blocked;
                    return matchesQuery && matchesStatus;
                  }).toList();

                  return ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: _tab == 0
                      ? [
                          if (settings.apps.isNotEmpty) ...[
                            _AppSearchField(
                              controller: _searchController,
                              onChanged: (v) => setState(() => _query = v),
                            ),
                            const SizedBox(height: 10),
                            _SegmentControl(
                              labels: const ['Unlocked', 'Locked'],
                              current: _statusFilter,
                              onChanged: (i) => setState(() => _statusFilter = i),
                            ),
                            const SizedBox(height: 10),
                          ],
                          settings.apps.isEmpty
                              ? _EmptyAppsHint(
                                  onTap: () => _showAddAppSheet(context, ref, settings.apps),
                                )
                              : filteredApps.isEmpty
                                  ? _EmptyFilterHint(locked: _statusFilter == 1)
                                  : _AppsList(
                                      apps: filteredApps,
                                      indexOf: (app) => settings.apps.indexOf(app),
                                      onToggle: (i) async {
                                        final isUnblocking = settings.apps[i].blocked;
                                        if (isUnblocking &&
                                            !await _verifyPin(context, ref)) {
                                          return;
                                        }
                                        ref
                                            .read(blockSettingsProvider.notifier)
                                            .toggleApp(i);
                                      },
                                      onEditLimits: (i) =>
                                          _showLimitsSheet(context, ref, i, settings.apps[i]),
                                      onRemove: (i) async {
                                        if (!await _verifyPin(context, ref)) return;
                                        ref
                                            .read(blockSettingsProvider.notifier)
                                            .removeApp(i);
                                      },
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
                          _LocationRulesCard(
                            installedApps: const [],
                            onShowAdd: () => _showAddLocationSheet(context, ref),
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
                              onRemove: (i) async {
                                if (!await _verifyPin(context, ref)) return;
                                ref
                                    .read(blockSettingsProvider.notifier)
                                    .removeKeyword(i);
                              },
                            ),
                          ),
                          const SizedBox(height: 10),
                          const _SavedIndicator(),
                          const SizedBox(height: 20),
                        ],
                );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Secure header ───────────────────────────────────────────────────────────

class _SecureHeader extends StatelessWidget {
  const _SecureHeader({
    required this.lockedCount,
    required this.totalCount,
    required this.onAdd,
  });
  final int          lockedCount;
  final int          totalCount;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [ct.purpleDeep, ct.purple],
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Secure Your Apps',
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: ct.textPrimary)),
                const SizedBox(height: 6),
                Text(
                  totalCount == 0
                      ? 'No apps added yet'
                      : '$lockedCount of $totalCount apps locked',
                  style: TextStyle(fontSize: 13, color: ct.purplePale),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: onAdd,
            child: Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(TablerIcons.plus, size: 20, color: ct.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Search field ────────────────────────────────────────────────────────────

class _AppSearchField extends StatelessWidget {
  const _AppSearchField({required this.controller, required this.onChanged});
  final TextEditingController controller;
  final ValueChanged<String>  onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      style: TextStyle(fontSize: 13, color: ct.textSecondary),
      decoration: InputDecoration(
        hintText: 'Search apps…',
        prefixIcon: Icon(TablerIcons.search, size: 18, color: ct.textDisabled),
      ),
    );
  }
}

// ─── Empty filter hint ───────────────────────────────────────────────────────

class _EmptyFilterHint extends StatelessWidget {
  const _EmptyFilterHint({required this.locked});
  final bool locked;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
      decoration: BoxDecoration(
        color: ct.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ct.border, width: 0.5),
      ),
      child: Column(
        children: [
          Icon(TablerIcons.search_off, size: 28, color: ct.textDisabled),
          const SizedBox(height: 10),
          Text(
            locked
                ? 'No locked apps match your search'
                : 'No unlocked apps match your search',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: ct.textDisabled),
          ),
        ],
      ),
    );
  }
}

// ─── Apps list ───────────────────────────────────────────────────────────────

class _EmptyAppsHint extends StatelessWidget {
  const _EmptyAppsHint({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
        decoration: BoxDecoration(
          color: ct.bgCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: ct.border, width: 0.5),
        ),
        child: Column(
          children: [
            Icon(TablerIcons.apps, size: 28, color: ct.textDisabled),
            const SizedBox(height: 10),
            Text('No apps blocked yet',
                style: TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w500, color: ct.textSecondary)),
            const SizedBox(height: 4),
            Text('Tap + above to add apps to block',
                style: TextStyle(fontSize: 12, color: ct.textDisabled)),
          ],
        ),
      ),
    );
  }
}

class _AppsList extends StatelessWidget {
  const _AppsList({
    required this.apps,
    required this.indexOf,
    required this.onToggle,
    required this.onEditLimits,
    required this.onRemove,
  });
  final List<AppEntry>      apps;
  final int Function(AppEntry) indexOf;
  final ValueChanged<int>   onToggle;
  final ValueChanged<int>   onEditLimits;
  final ValueChanged<int>   onRemove;

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
          final listIndex = e.key;
          final app       = e.value;
          final i         = indexOf(app);
          return Dismissible(
            key: ValueKey('${app.packageName}-${app.name}-$i'),
            direction: DismissDirection.endToStart,
            background: Container(
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 18),
              color: ct.pink.withOpacity(0.15),
              child: Icon(TablerIcons.trash, size: 18, color: ct.pink),
            ),
            onDismissed: (_) => onRemove(i),
            child: _AppRow(
                app: app,
                isLast: listIndex == apps.length - 1,
                onToggle: () => onToggle(i),
                onEditLimits: () => onEditLimits(i)),
          );
        }).toList(),
      ),
    );
  }
}

class _AppRow extends StatelessWidget {
  const _AppRow({
    required this.app,
    required this.isLast,
    required this.onToggle,
    required this.onEditLimits,
  });
  final AppEntry     app;
  final bool         isLast;
  final VoidCallback onToggle;
  final VoidCallback onEditLimits;

  static const _avatarColors = [
    Color(0xFF7C5CFC), Color(0xFF38B6A6), Color(0xFFE0A23B),
    Color(0xFFE0577A), Color(0xFF4C9AE0), Color(0xFF6FCF7A),
  ];

  Color _avatarColor(String name) =>
      _avatarColors[name.codeUnits.fold<int>(0, (a, b) => a + b) % _avatarColors.length];

  @override
  Widget build(BuildContext context) {
    final hasLimits = app.openLimitPerDay != null || app.timeLimitMinutes != null;
    return Container(
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
          _AppIcon(app: app, avatarColor: _avatarColor(app.name)),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: onEditLimits,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(app.name,
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: ct.textSecondary)),
                  Text(
                    hasLimits
                        ? [
                            if (app.openLimitPerDay != null) '${app.openLimitPerDay}x/day',
                            if (app.timeLimitMinutes != null) '${app.timeLimitMinutes}min/day',
                          ].join(' · ')
                        : app.category,
                    style: TextStyle(
                        fontSize: 11,
                        color: hasLimits ? ct.purpleLight : ct.textDisabled),
                  ),
                ],
              ),
            ),
          ),
          GestureDetector(
            onTap: onEditLimits,
            child: Padding(
              padding: const EdgeInsets.all(6),
              child: Icon(TablerIcons.adjustments_horizontal,
                  size: 16, color: hasLimits ? ct.purpleLight : ct.textDisabled),
            ),
          ),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: onToggle,
            child: Padding(
              padding: const EdgeInsets.all(6),
              child: Icon(
                app.blocked ? TablerIcons.lock : TablerIcons.lock_open,
                size: 20,
                color: app.blocked ? ct.purpleLight : ct.textDisabled,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── App icon ────────────────────────────────────────────────────────────────
// Loads the real launcher icon for a package (base64 PNG from native).
// Falls back to coloured circle + initial when unavailable.

class _AppIcon extends StatefulWidget {
  const _AppIcon({required this.app, required this.avatarColor});
  final AppEntry app;
  final Color    avatarColor;

  @override
  State<_AppIcon> createState() => _AppIconState();
}

class _AppIconState extends State<_AppIcon> {
  Uint8List? _bytes;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(_AppIcon old) {
    super.didUpdateWidget(old);
    if (old.app.packageName != widget.app.packageName) {
      setState(() { _bytes = null; _loaded = false; });
      _load();
    }
  }

  Future<void> _load() async {
    final pkg = widget.app.packageName;
    if (pkg == null || pkg.isEmpty) { setState(() => _loaded = true); return; }
    final b64 = await BlockingChannel.getAppIcon(pkg);
    if (!mounted) return;
    setState(() {
      _bytes = b64 != null ? base64Decode(b64) : null;
      _loaded = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loaded && _bytes != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Image.memory(_bytes!, width: 38, height: 38, fit: BoxFit.cover),
      );
    }
    // Fallback: coloured circle with first letter
    return Container(
      width: 38, height: 38,
      decoration: BoxDecoration(
        color: widget.avatarColor.withOpacity(0.25),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          widget.app.name.isNotEmpty ? widget.app.name[0].toUpperCase() : '?',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: widget.avatarColor,
          ),
        ),
      ),
    );
  }
}

// ─── Add app sheet ───────────────────────────────────────────────────────────

class _AddAppSheet extends StatefulWidget {
  const _AddAppSheet({
    required this.existingPackages,
    required this.onAddInstalled,
    required this.onAddManual,
  });
  final Set<String> existingPackages;
  final void Function(String name, String packageName) onAddInstalled;
  final void Function(String name) onAddManual;

  @override
  State<_AddAppSheet> createState() => _AddAppSheetState();
}

class _AddAppSheetState extends State<_AddAppSheet> {
  List<Map<String, dynamic>> _allApps = [];
  bool _loading = true;
  String _query = '';
  final TextEditingController _manualController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final apps = await BlockingChannel.getInstalledApps();
    apps.sort((a, b) =>
        (a['appName'] as String).toLowerCase().compareTo((b['appName'] as String).toLowerCase()));
    if (!mounted) return;
    setState(() {
      _allApps = apps;
      _loading = false;
    });
  }

  @override
  void dispose() {
    _manualController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _allApps
        .where((a) => !widget.existingPackages.contains(a['packageName']))
        .where((a) => (a['appName'] as String).toLowerCase().contains(_query.toLowerCase()))
        .toList();

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.75,
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
        decoration: BoxDecoration(
          color: ct.bgSurface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(
                  color: ct.border, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            Text('Add an app to block',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: ct.textPrimary)),
            const SizedBox(height: 14),
            TextField(
              style: TextStyle(color: ct.textSecondary, fontSize: 13),
              decoration: const InputDecoration(hintText: 'Search installed apps…'),
              onChanged: (v) => setState(() => _query = v),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: _loading
                  ? Center(child: CircularProgressIndicator(color: ct.purpleLight))
                  : filtered.isEmpty
                      ? Center(
                          child: Text('No matching apps found',
                              style: TextStyle(fontSize: 13, color: ct.textDisabled)))
                      : ListView.builder(
                          itemCount: filtered.length,
                          itemBuilder: (_, i) {
                            final a = filtered[i];
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: Icon(TablerIcons.apps, color: ct.purpleLight),
                              title: Text(a['appName'] as String,
                                  style: TextStyle(fontSize: 14, color: ct.textPrimary)),
                              trailing: Icon(TablerIcons.plus, size: 18, color: ct.purpleLight),
                              onTap: () {
                                widget.onAddInstalled(
                                    a['appName'] as String, a['packageName'] as String);
                                Navigator.pop(context);
                              },
                            );
                          },
                        ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _manualController,
                    style: TextStyle(color: ct.textSecondary, fontSize: 13),
                    decoration: const InputDecoration(hintText: 'Or add a custom entry by name…'),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () {
                    final name = _manualController.text.trim();
                    if (name.isEmpty) return;
                    widget.onAddManual(name);
                    Navigator.pop(context);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: ct.purple,
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Text('Add',
                        style: TextStyle(fontSize: 13, color: ct.textPrimary)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Per-app limits sheet ──────────────────────────────────────────────────

class _AppLimitsSheet extends StatefulWidget {
  const _AppLimitsSheet({required this.app, required this.onSave});
  final AppEntry app;
  final void Function(int? openLimit, int? timeLimit) onSave;

  @override
  State<_AppLimitsSheet> createState() => _AppLimitsSheetState();
}

class _AppLimitsSheetState extends State<_AppLimitsSheet> {
  late bool _openEnabled;
  late bool _timeEnabled;
  late int  _openLimit;
  late int  _timeLimit;

  @override
  void initState() {
    super.initState();
    _openEnabled = widget.app.openLimitPerDay != null;
    _timeEnabled = widget.app.timeLimitMinutes != null;
    _openLimit   = widget.app.openLimitPerDay ?? 3;
    _timeLimit   = widget.app.timeLimitMinutes ?? 30;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        decoration: BoxDecoration(
          color: ct.bgSurface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(
                  color: ct.border, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Text(widget.app.emoji, style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 10),
                Text('${widget.app.name} limits',
                    style: TextStyle(
                        fontSize: 17, fontWeight: FontWeight.w600, color: ct.textPrimary)),
              ],
            ),
            const SizedBox(height: 20),

            _LimitRow(
              icon: TablerIcons.repeat,
              title: 'Daily open limit',
              subtitle: _openEnabled
                  ? 'Warns on the last allowed open, blocks after that'
                  : 'Off — unlimited opens',
              enabled: _openEnabled,
              onToggle: (v) => setState(() => _openEnabled = v),
              valueLabel: '$_openLimit ${_openLimit == 1 ? 'time' : 'times'}/day',
              value: _openLimit.toDouble(),
              min: 1, max: 100,
              onChanged: (v) => setState(() => _openLimit = v.round()),
            ),
            const SizedBox(height: 18),
            _LimitRow(
              icon: TablerIcons.clock_hour_4,
              title: 'Daily time limit',
              subtitle: _timeEnabled
                  ? 'Warns near the end, blocks once time is used up'
                  : 'Off — unlimited time',
              enabled: _timeEnabled,
              onToggle: (v) => setState(() => _timeEnabled = v),
              valueLabel: '$_timeLimit min/day',
              value: _timeLimit.toDouble(),
              min: 5, max: 180,
              divisions: 35,
              onChanged: (v) => setState(() => _timeLimit = v.round()),
            ),

            const SizedBox(height: 22),
            GestureDetector(
              onTap: () {
                widget.onSave(
                  _openEnabled ? _openLimit : null,
                  _timeEnabled ? _timeLimit : null,
                );
                Navigator.pop(context);
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 15),
                decoration: BoxDecoration(
                  color: ct.primary,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text('Save',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w500, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LimitRow extends StatelessWidget {
  const _LimitRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.enabled,
    required this.onToggle,
    required this.valueLabel,
    required this.value,
    required this.min,
    required this.max,
    required this.onChanged,
    this.divisions,
  });

  final IconData icon;
  final String   title;
  final String   subtitle;
  final bool     enabled;
  final ValueChanged<bool> onToggle;
  final String   valueLabel;
  final double   value;
  final double   min;
  final double   max;
  final int?     divisions;
  final ValueChanged<double> onChanged;

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
          Row(
            children: [
              Icon(icon, size: 18, color: ct.purpleLight),
              const SizedBox(width: 8),
              Expanded(
                child: Text(title,
                    style: TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w500, color: ct.textPrimary)),
              ),
              _ClaritySwitch(value: enabled, onChanged: onToggle),
            ],
          ),
          const SizedBox(height: 4),
          Text(subtitle, style: TextStyle(fontSize: 11, color: ct.textDisabled)),
          if (enabled) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      activeTrackColor: ct.purple,
                      inactiveTrackColor: ct.bgElevated,
                      thumbColor: ct.purpleLight,
                      overlayColor: ct.purpleTint,
                    ),
                    child: Slider(
                      value: value.clamp(min, max),
                      min: min, max: max, divisions: divisions,
                      onChanged: onChanged,
                    ),
                  ),
                ),
                SizedBox(
                  width: 78,
                  child: Text(valueLabel,
                      textAlign: TextAlign.right,
                      style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w500, color: ct.purpleLight)),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Location rules card ─────────────────────────────────────────────────────

class _LocationRulesCard extends ConsumerWidget {
  const _LocationRulesCard({required this.installedApps, required this.onShowAdd});
  final List<Map<String, dynamic>> installedApps;
  final VoidCallback onShowAdd;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rulesAsync  = ref.watch(locationRulesProvider);
    final activeAsync = ref.watch(activeGeofencesProvider);
    final activeIds   = activeAsync.valueOrNull ?? {};
    final rules       = rulesAsync.valueOrNull ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('LOCATION RULES',
                style: TextStyle(fontSize: 11, color: ct.textDisabled, letterSpacing: 0.8)),
            GestureDetector(
              onTap: onShowAdd,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: ct.purpleTint,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(TablerIcons.plus, size: 12, color: ct.purpleLight),
                    const SizedBox(width: 4),
                    Text('Add', style: TextStyle(fontSize: 12, color: ct.purpleLight)),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: ct.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: ct.border, width: 0.5),
          ),
          child: rules.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'No location rules yet.\nAdd one to automatically block apps when you arrive at a saved location.',
                    style: TextStyle(fontSize: 13, color: ct.textDisabled, height: 1.5),
                  ),
                )
              : Column(
                  children: rules.asMap().entries.map((e) {
                    final rule   = e.value;
                    final isLast = e.key == rules.length - 1;
                    final active = activeIds.contains(rule.id);
                    return Container(
                      decoration: BoxDecoration(
                        border: isLast ? null : Border(
                            bottom: BorderSide(color: ct.borderFaint, width: 0.5)),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(
                              color: active ? ct.teal.withOpacity(0.15) : ct.bgElevated,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              TablerIcons.map_pin,
                              size: 18,
                              color: active ? ct.teal : ct.textDisabled,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(rule.name,
                                        style: TextStyle(fontSize: 14,
                                            fontWeight: FontWeight.w500,
                                            color: ct.textSecondary)),
                                    if (active) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: ct.tealTint,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text('Here now',
                                            style: TextStyle(fontSize: 10, color: ct.teal)),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  rule.appNames.isEmpty
                                      ? rule.coordLabel
                                      : '${rule.appNames.take(3).join(', ')}${rule.appNames.length > 3 ? ' +${rule.appNames.length - 3}' : ''} · ${rule.radiusMeters.round()}m radius',
                                  style: TextStyle(fontSize: 11, color: ct.textDisabled),
                                ),
                              ],
                            ),
                          ),
                          GestureDetector(
                            onTap: () => ref.read(locationRulesProvider.notifier).removeRule(rule.id),
                            child: Padding(
                              padding: const EdgeInsets.all(6),
                              child: Icon(TablerIcons.trash, size: 16, color: ct.textDisabled),
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

// ─── Add location sheet ───────────────────────────────────────────────────────

class _AddLocationSheet extends StatefulWidget {
  const _AddLocationSheet({required this.onSave});
  final void Function(String name, double lat, double lng, double radius,
      List<String> packages, List<String> appNames) onSave;

  @override
  State<_AddLocationSheet> createState() => _AddLocationSheetState();
}

class _AddLocationSheetState extends State<_AddLocationSheet> {
  final _nameCtrl = TextEditingController();
  double? _lat, _lng;
  double _radius = 100;
  bool _loading  = false;
  String? _error;

  // Apps picked for this location rule
  final _picked = <String, String>{}; // package -> display name

  List<Map<String, dynamic>> _installedApps = [];
  bool _loadingApps = false;

  @override
  void initState() {
    super.initState();
    _fetchApps();
    _detectLocation();
  }

  @override
  void dispose() { _nameCtrl.dispose(); super.dispose(); }

  Future<void> _fetchApps() async {
    setState(() => _loadingApps = true);
    final apps = await BlockingChannel.getInstalledApps();
    if (mounted) setState(() { _installedApps = apps; _loadingApps = false; });
  }

  Future<void> _detectLocation() async {
    setState(() { _loading = true; _error = null; });
    try {
      final loc = await BlockingChannel.getCurrentLocation();
      if (mounted) setState(() { _lat = loc['lat']; _lng = loc['lng']; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _loading = false; _error = 'Could not get location. Grant location permission first.'; });
    }
  }

  Future<void> _save() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) { setState(() => _error = 'Enter a name for this location.'); return; }
    if (_lat == null || _lng == null) { setState(() => _error = 'Location not available yet.'); return; }
    widget.onSave(name, _lat!, _lng!, _radius,
        _picked.keys.toList(), _picked.values.toList());
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final canSave = _nameCtrl.text.trim().isNotEmpty && _lat != null;
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      builder: (_, scroll) => Container(
        decoration: BoxDecoration(
          color: ct.bgCard,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(width: 36, height: 4,
                decoration: BoxDecoration(color: ct.border, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Text('Add Location Rule',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600,
                          color: ct.textPrimary)),
                  const Spacer(),
                  GestureDetector(
                    onTap: canSave ? _save : null,
                    child: Text('Save',
                        style: TextStyle(fontSize: 15, color: canSave ? ct.purpleLight : ct.textDisabled,
                            fontWeight: FontWeight.w500)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                controller: scroll,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  // Name
                  TextField(
                    controller: _nameCtrl,
                    style: TextStyle(color: ct.textPrimary),
                    decoration: InputDecoration(
                      labelText: 'Location name',
                      hintText: 'e.g. Church, School, Work, Home',
                      labelStyle: TextStyle(color: ct.textDisabled),
                      hintStyle: TextStyle(color: ct.textDisabled),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 20),

                  // Location
                  Row(
                    children: [
                      Icon(TablerIcons.map_pin, size: 16, color: ct.textDisabled),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _loading
                            ? Text('Detecting location…', style: TextStyle(fontSize: 13, color: ct.textDisabled))
                            : _lat != null
                                ? Text(
                                    '${_lat!.abs().toStringAsFixed(4)}°${_lat! >= 0 ? 'N' : 'S'}, '
                                    '${_lng!.abs().toStringAsFixed(4)}°${_lng! >= 0 ? 'E' : 'W'}',
                                    style: TextStyle(fontSize: 13, color: ct.textMuted))
                                : Text(_error ?? 'Location unavailable',
                                    style: TextStyle(fontSize: 13, color: ct.red)),
                      ),
                      GestureDetector(
                        onTap: _detectLocation,
                        child: Text('Refresh', style: TextStyle(fontSize: 12, color: ct.purpleLight)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Radius picker
                  Text('Radius', style: TextStyle(fontSize: 13, color: ct.textDisabled)),
                  const SizedBox(height: 8),
                  Row(
                    children: [50.0, 100.0, 200.0, 500.0].map((r) {
                      final sel = _radius == r;
                      return GestureDetector(
                        onTap: () => setState(() => _radius = r),
                        child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: sel ? ct.purpleTint : ct.bgElevated,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: sel ? ct.purple : ct.border, width: 0.5),
                          ),
                          child: Text('${r.round()}m',
                              style: TextStyle(fontSize: 12,
                                  color: sel ? ct.purpleLight : ct.textDisabled)),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 20),

                  // App picker
                  Text('Block these apps at this location',
                      style: TextStyle(fontSize: 13, color: ct.textDisabled)),
                  const SizedBox(height: 8),
                  if (_loadingApps)
                    Center(child: CircularProgressIndicator(color: ct.purpleLight, strokeWidth: 2))
                  else if (_installedApps.isEmpty)
                    Text('No installed apps found.',
                        style: TextStyle(fontSize: 13, color: ct.textDisabled))
                  else
                    ..._installedApps.map((app) {
                      final pkg  = app['packageName'] as String;
                      final name = app['appName'] as String;
                      final sel  = _picked.containsKey(pkg);
                      return ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: _AppIcon(
                          app: AppEntry(emoji: '📱', name: name, category: 'App', blocked: false, packageName: pkg),
                          avatarColor: const Color(0xFF7C5CFC),
                        ),
                        title: Text(name, style: TextStyle(fontSize: 14, color: ct.textSecondary)),
                        trailing: Icon(
                          sel ? TablerIcons.square_check_filled : TablerIcons.square,
                          size: 20, color: sel ? ct.purpleLight : ct.textDisabled,
                        ),
                        onTap: () => setState(() {
                          if (sel) _picked.remove(pkg); else _picked[pkg] = name;
                        }),
                      );
                    }),
                  const SizedBox(height: 32),
                ],
              ),
            ),
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
