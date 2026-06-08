// lib/features/paywall/presentation/widgets/premium_gate.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';

import '../../../../core/theme/app_theme.dart';
import '../../application/subscription_provider.dart';
import '../screens/paywall_screen.dart';

/// Wraps [child] — if the user isn't premium, shows a lock overlay instead.
/// Usage:
///   PremiumGate(
///     feature: 'Strict mode',
///     child: StrictModeWidget(),
///   )
class PremiumGate extends ConsumerWidget {
  const PremiumGate({
    super.key,
    required this.feature,
    required this.child,
    this.description,
  });

  final String  feature;
  final String? description;
  final Widget  child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPremium = ref.watch(isPremiumProvider);
    if (isPremium) return child;
    return _LockedOverlay(feature: feature, description: description);
  }
}

class _LockedOverlay extends StatelessWidget {
  const _LockedOverlay({required this.feature, this.description});
  final String  feature;
  final String? description;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => const FractionallySizedBox(
          heightFactor: 0.92,
          child: PaywallScreen(),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: ct.bgCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: ct.border, width: 0.5),
        ),
        child: Row(
          children: [
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                color: ct.purpleTint,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(TablerIcons.lock,
                  size: 18, color: ct.purpleLight),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(feature,
                      style: TextStyle(fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: ct.textSecondary)),
                  if (description != null) ...[
                    const SizedBox(height: 2),
                    Text(description!,
                        style: TextStyle(fontSize: 11,
                            color: ct.textDisabled)),
                  ],
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: ct.purple,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text('Unlock',
                  style: TextStyle(fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: ct.textPrimary)),
            ),
          ],
        ),
      ),
    );
  }
}
