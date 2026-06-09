// lib/features/permissions/presentation/screens/permissions_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../application/permissions_provider.dart';

class PermissionsScreen extends ConsumerStatefulWidget {
  const PermissionsScreen({super.key});

  @override
  ConsumerState<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends ConsumerState<PermissionsScreen>
    with WidgetsBindingObserver {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(permissionsProvider.notifier).refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final perms = ref.watch(permissionsProvider);

    return Scaffold(
      backgroundColor: ct.bgSurface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Set Up Blocking',
                  style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w600,
                      color: ct.textPrimary)),
              const SizedBox(height: 6),
              Text(
                'Productivity Max needs 3 permissions to monitor and block apps on your device.',
                style: TextStyle(fontSize: 14, color: ct.textDisabled),
              ),
              const SizedBox(height: 12),

              _ProgressBar(granted: perms.grantedCount, total: 3),
              const SizedBox(height: 28),

              _PermissionCard(
                icon: TablerIcons.chart_bar,
                iconColor: ct.teal,
                title: 'Usage Access',
                subtitle: 'Lets Productivity Max read how long each app is open — powers your screen time stats.',
                granted: perms.hasUsage,
                onTap: perms.hasUsage ? null
                    : () => ref.read(permissionsProvider.notifier).requestUsage(),
              ),
              const SizedBox(height: 12),
              _PermissionCard(
                icon: TablerIcons.shield_lock,
                iconColor: ct.primary,
                title: 'Accessibility',
                subtitle: 'Detects when a blocked app opens and shows the blocking screen immediately.',
                granted: perms.hasAccessibility,
                onTap: perms.hasAccessibility ? null
                    : () => ref.read(permissionsProvider.notifier).requestAccessibility(),
              ),
              const SizedBox(height: 12),
              _PermissionCard(
                icon: TablerIcons.network,
                iconColor: ct.pink,
                title: 'VPN (Website Blocking)',
                subtitle: 'Runs a local VPN to block websites and keywords across all apps and browsers.',
                granted: perms.hasVpn,
                onTap: perms.hasVpn ? null
                    : () => ref.read(permissionsProvider.notifier).requestVpn(),
              ),

              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: ct.bgCard,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: ct.border, width: 0.5),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(TablerIcons.lock, size: 16, color: ct.textDisabled),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'All data stays on your device. Productivity Max never reads message content, passwords, or personal files.',
                        style: TextStyle(fontSize: 12, color: ct.textDisabled),
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              if (perms.allGranted) ...[
                _ClarityButton(
                  label: 'All set — start blocking',
                  onTap: () => context.go(Routes.home),
                ),
              ] else ...[
                _ClarityButton(
                  label: 'Skip for now',
                  secondary: true,
                  onTap: () => context.go(Routes.home),
                ),
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    '${perms.grantedCount} of 3 granted — blocking won\'t work until all 3 are on',
                    style: TextStyle(fontSize: 11, color: ct.textDisabled),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

class _ProgressBar extends StatelessWidget {
  const _ProgressBar({required this.granted, required this.total});
  final int granted;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('$granted of $total permissions granted',
                style: TextStyle(fontSize: 12, color: ct.textDisabled)),
            Text('${(granted / total * 100).round()}%',
                style: TextStyle(fontSize: 12, color: ct.primaryLight)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: granted / total,
            minHeight: 6,
            backgroundColor: ct.bgElevated,
            valueColor: AlwaysStoppedAnimation<Color>(ct.primary),
          ),
        ),
      ],
    );
  }
}

// ─── Permission card ──────────────────────────────────────────────────────────

class _PermissionCard extends StatelessWidget {
  const _PermissionCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.granted,
    this.onTap,
  });

  final IconData  icon;
  final Color     iconColor;
  final String    title;
  final String    subtitle;
  final bool      granted;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        color: granted ? (ct.isDark ? const Color(0xFF0D1F14) : const Color(0xFFECFDF5))
                       : ct.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: granted ? (ct.isDark ? const Color(0xFF1A4D2E) : const Color(0xFF6EE7B7))
                         : ct.border,
          width: 0.5,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 42, height: 42,
                  decoration: BoxDecoration(
                    color: iconColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: iconColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: ct.textPrimary)),
                      const SizedBox(height: 3),
                      Text(subtitle,
                          style: TextStyle(
                              fontSize: 12, color: ct.textDisabled)),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                if (granted)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: ct.tealTint,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(TablerIcons.check, size: 12, color: ct.teal),
                        const SizedBox(width: 4),
                        Text('On', style: TextStyle(fontSize: 11, color: ct.teal)),
                      ],
                    ),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: ct.bgElevated,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(TablerIcons.arrow_right, size: 12, color: ct.primaryLight),
                        const SizedBox(width: 4),
                        Text('Enable',
                            style: TextStyle(fontSize: 11, color: ct.primaryLight)),
                      ],
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

// ─── Button ───────────────────────────────────────────────────────────────────

class _ClarityButton extends StatelessWidget {
  const _ClarityButton({
    required this.label,
    required this.onTap,
    this.secondary = false,
  });
  final String       label;
  final VoidCallback onTap;
  final bool         secondary;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 15),
        decoration: BoxDecoration(
          color: secondary ? ct.bgCard : ct.primary,
          borderRadius: BorderRadius.circular(14),
          border: secondary ? Border.all(color: ct.border, width: 0.5) : null,
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: secondary ? ct.textDisabled : Colors.white,
          ),
        ),
      ),
    );
  }
}
