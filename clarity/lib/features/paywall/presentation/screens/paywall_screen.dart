// lib/features/paywall/presentation/screens/paywall_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/router/app_router.dart';
import '../../application/subscription_provider.dart';
import '../../domain/subscription_plan.dart';

class PaywallScreen extends ConsumerStatefulWidget {
  /// [isDismissible] — false when shown after onboarding (must choose),
  /// true when opened from settings.
  const PaywallScreen({super.key, this.isDismissible = true});
  final bool isDismissible;

  @override
  ConsumerState<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends ConsumerState<PaywallScreen> {
  String? _selectedProductId = RCProductIds.annual; // default to annual

  @override
  Widget build(BuildContext context) {
    final plansAsync   = ref.watch(plansProvider);
    final purchaseState = ref.watch(purchaseNotifierProvider);
    final loading      = purchaseState.isLoading;

    return Scaffold(
      backgroundColor: ClarityColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── Close button ──
            if (widget.isDismissible)
              Align(
                alignment: Alignment.topRight,
                child: GestureDetector(
                  onTap: () => context.pop(),
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Icon(TablerIcons.x,
                        size: 20, color: ClarityColors.textDisabled),
                  ),
                ),
              )
            else
              const SizedBox(height: 16),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    // ── Icon + headline ──
                    _PaywallHero(),
                    const SizedBox(height: 28),

                    // ── Trial badge ──
                    _TrialBadge(),
                    const SizedBox(height: 24),

                    // ── Feature list ──
                    _FeatureList(),
                    const SizedBox(height: 28),

                    // ── Plan selector ──
                    plansAsync.when(
                      loading: () => const _PlanSkeleton(),
                      error:   (_, __) => _PlanSelector(
                        plans:      SubscriptionPlan.defaults,
                        selected:   _selectedProductId,
                        onSelect:   (id) => setState(() => _selectedProductId = id),
                      ),
                      data: (plans) => _PlanSelector(
                        plans:    plans,
                        selected: _selectedProductId ?? plans.last.productId,
                        onSelect: (id) => setState(() => _selectedProductId = id),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── Error ──
                    if (purchaseState.errorMsg != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Text(purchaseState.errorMsg!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                fontSize: 13, color: ClarityColors.red)),
                      ),

                    // ── CTA ──
                    _CTAButton(
                      loading:   loading,
                      onPressed: () => _purchase(context),
                    ),
                    const SizedBox(height: 12),

                    // ── Restore + legal ──
                    _FooterLinks(),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _purchase(BuildContext context) {
    final plansData = ref.read(plansProvider).valueOrNull
        ?? SubscriptionPlan.defaults;
    final plan = plansData.firstWhere(
      (p) => p.productId == (_selectedProductId ?? RCProductIds.annual),
      orElse: () => plansData.last,
    );
    ref.read(purchaseNotifierProvider.notifier).purchase(plan).then((_) {
      final state = ref.read(purchaseNotifierProvider);
      if (state.state == PurchaseState.success && mounted) {
        context.go(Routes.home);
      }
    });
  }
}

// ─── Sub-widgets ──────────────────────────────────────────────────────────────

class _PaywallHero extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 72, height: 72,
          decoration: BoxDecoration(
            color: ClarityColors.purpleDeep,
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Icon(TablerIcons.leaf,
              size: 34, color: ClarityColors.purplePale),
        ),
        const SizedBox(height: 16),
        const Text('Unlock Clarity Premium',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w500,
                color: ClarityColors.textPrimary)),
        const SizedBox(height: 8),
        const Text('Everything you need to take back your time.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: ClarityColors.textFaint, height: 1.5)),
      ],
    );
  }
}

class _TrialBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: ClarityColors.tealTint,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: ClarityColors.tealDark, width: 0.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: const [
          Icon(TablerIcons.clock, size: 16, color: ClarityColors.teal),
          SizedBox(width: 8),
          Text('7-day free trial — cancel anytime',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
                  color: ClarityColors.tealLight)),
        ],
      ),
    );
  }
}

const _features = [
  (TablerIcons.shield_lock,  ClarityColors.purpleLight, 'Strict mode',
      'Block with no override — for when willpower isn\'t enough'),
  (TablerIcons.filter,       ClarityColors.teal,        'Keyword blocking',
      'Block any site or app containing specific words'),
  (TablerIcons.heart_handshake, ClarityColors.pink,     'Community SOS',
      'Reach out to a real person when you\'re struggling'),
  (TablerIcons.clock,        ClarityColors.amber,       'Unlimited schedules',
      'Set different block rules for mornings, evenings, weekends'),
  (TablerIcons.chart_bar,    ClarityColors.purpleLight, 'Detailed analytics',
      'See exactly how your habits are changing over time'),
  (TablerIcons.sparkles,     ClarityColors.teal,        'AI companion',
      'Personalised nudges based on your patterns'),
];

class _FeatureList extends StatelessWidget {
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
        children: _features.asMap().entries.map((e) {
          final i   = e.key;
          final f   = e.value;
          final last = i == _features.length - 1;
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color: (f.$2 as Color).withAlpha(26),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(f.$1 as IconData,
                          size: 16, color: f.$2 as Color),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(f.$3 as String,
                              style: const TextStyle(fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: ClarityColors.textSecondary)),
                          const SizedBox(height: 2),
                          Text(f.$4 as String,
                              style: const TextStyle(fontSize: 11,
                                  color: ClarityColors.textDisabled,
                                  height: 1.4)),
                        ],
                      ),
                    ),
                    const Icon(TablerIcons.check,
                        size: 16, color: ClarityColors.teal),
                  ],
                ),
              ),
              if (!last)
                const Divider(
                    color: ClarityColors.borderFaint,
                    thickness: 0.5,
                    height: 0),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _PlanSelector extends StatelessWidget {
  const _PlanSelector({
    required this.plans,
    required this.selected,
    required this.onSelect,
  });
  final List<SubscriptionPlan> plans;
  final String?                selected;
  final ValueChanged<String>   onSelect;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: plans.map((plan) {
        final isSel = plan.productId == selected;
        return GestureDetector(
          onTap: () => onSelect(plan.productId),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isSel ? ClarityColors.purpleTint : ClarityColors.bgCard,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSel ? ClarityColors.purple : ClarityColors.border,
                width: isSel ? 1 : 0.5,
              ),
            ),
            child: Row(
              children: [
                // Radio dot
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 18, height: 18,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSel ? ClarityColors.purple : Colors.transparent,
                    border: Border.all(
                      color: isSel ? ClarityColors.purple : ClarityColors.border,
                      width: 1.5,
                    ),
                  ),
                  child: isSel
                      ? const Center(
                          child: Icon(TablerIcons.check,
                              size: 10, color: ClarityColors.textPrimary))
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(plan.title,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                                color: isSel
                                    ? ClarityColors.textPrimary
                                    : ClarityColors.textSecondary,
                              )),
                          if (plan.badge != null) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: ClarityColors.teal.withAlpha(34),
                                borderRadius: BorderRadius.circular(5),
                              ),
                              child: Text(plan.badge!,
                                  style: const TextStyle(fontSize: 10,
                                      fontWeight: FontWeight.w500,
                                      color: ClarityColors.teal)),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(plan.pricePerMonth,
                          style: const TextStyle(fontSize: 11,
                              color: ClarityColors.textDisabled)),
                    ],
                  ),
                ),
                Text(plan.price,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: isSel
                          ? ClarityColors.purpleLight
                          : ClarityColors.textSecondary,
                    )),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _PlanSkeleton extends StatelessWidget {
  const _PlanSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(2, (i) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        height: 64,
        decoration: BoxDecoration(
          color: ClarityColors.bgCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: ClarityColors.border, width: 0.5),
        ),
      )),
    );
  }
}

class _CTAButton extends StatelessWidget {
  const _CTAButton({required this.loading, required this.onPressed});
  final bool         loading;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: loading ? null : onPressed,
      child: loading
          ? const SizedBox(width: 20, height: 20,
              child: CircularProgressIndicator(strokeWidth: 2,
                  color: ClarityColors.textPrimary))
          : const Text('Start free trial'),
    );
  }
}

class _FooterLinks extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loading = ref.watch(purchaseNotifierProvider).isLoading;
    return Column(
      children: [
        GestureDetector(
          onTap: loading
              ? null
              : () => ref.read(purchaseNotifierProvider.notifier).restore(),
          child: const Text('Restore purchases',
              style: TextStyle(fontSize: 12, color: ClarityColors.textDisabled,
                  decoration: TextDecoration.underline)),
        ),
        const SizedBox(height: 8),
        const Text(
          'Subscription auto-renews. Cancel anytime in App Store or Google Play settings.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 10, color: ClarityColors.textDisabled, height: 1.5),
        ),
      ],
    );
  }
}
