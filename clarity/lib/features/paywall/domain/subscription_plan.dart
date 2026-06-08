// lib/features/paywall/domain/subscription_plan.dart

// ─── RevenueCat product identifiers ──────────────────────────────────────────
// These must match EXACTLY what you create in App Store Connect
// and Google Play Console (see STORE_SETUP.md).

class RCEntitlements {
  RCEntitlements._();
  static const premium = 'clarity_premium'; // entitlement identifier in RevenueCat
}

class RCProductIds {
  RCProductIds._();
  static const monthly = 'clarity_monthly_499';  // $4.99/mo
  static const annual  = 'clarity_annual_4999';  // $49.99/yr
}

class RCOffering {
  RCOffering._();
  static const defaultOffering = 'default'; // offering identifier in RevenueCat
}

// ─── Plan model ───────────────────────────────────────────────────────────────

enum PlanInterval { monthly, annual }

class SubscriptionPlan {
  const SubscriptionPlan({
    required this.productId,
    required this.interval,
    required this.price,
    required this.pricePerMonth,
    required this.title,
    required this.badge,
  });

  final String       productId;
  final PlanInterval interval;
  final String       price;        // display price e.g. "$4.99"
  final String       pricePerMonth; // e.g. "$4.99/mo"
  final String       title;
  final String?      badge;        // e.g. "Best value" — null for monthly

  bool get isAnnual => interval == PlanInterval.annual;

  // Fallback plans shown before RevenueCat loads
  static const List<SubscriptionPlan> defaults = [
    SubscriptionPlan(
      productId:     RCProductIds.monthly,
      interval:      PlanInterval.monthly,
      price:         r'$4.99',
      pricePerMonth: r'$4.99/mo',
      title:         'Monthly',
      badge:         null,
    ),
    SubscriptionPlan(
      productId:     RCProductIds.annual,
      interval:      PlanInterval.annual,
      price:         r'$49.99',
      pricePerMonth: r'$4.17/mo',
      title:         'Annual',
      badge:         'Save 17%',
    ),
  ];
}

// ─── Subscription status ──────────────────────────────────────────────────────

class SubscriptionStatus {
  const SubscriptionStatus({
    required this.isActive,
    required this.isTrial,
    this.activeProductId,
    this.expiresAt,
  });

  final bool      isActive;
  final bool      isTrial;
  final String?   activeProductId;
  final DateTime? expiresAt;

  bool get isMonthly => activeProductId == RCProductIds.monthly;
  bool get isAnnual  => activeProductId == RCProductIds.annual;

  static const inactive = SubscriptionStatus(
    isActive: false, isTrial: false,
  );
}
