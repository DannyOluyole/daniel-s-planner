// lib/features/paywall/data/purchase_repository.dart
import 'package:purchases_flutter/purchases_flutter.dart';

import '../domain/subscription_plan.dart';

class PurchaseRepository {
  // ── Initialise RevenueCat ─────────────────────────────────────────────────
  // Call once from main() after Firebase.initializeApp()

  static Future<void> configure({required String appUserId}) async {
    await Purchases.setLogLevel(LogLevel.debug); // remove in production
    final config = PurchasesConfiguration(
      // !! Replace these with your real RevenueCat API keys !!
      // Android key starts with "goog_", iOS key starts with "appl_"
      // Get them from app.revenuecat.com → your project → API Keys
      'REVENUECAT_PUBLIC_SDK_KEY_PLACEHOLDER',
    );
    await Purchases.configure(config);
    // Link the Firebase UID so RevenueCat and Firebase stay in sync
    await Purchases.logIn(appUserId);
  }

  static Future<void> logOut() async {
    await Purchases.logOut();
  }

  // ── Fetch current offerings from RevenueCat ───────────────────────────────

  Future<List<SubscriptionPlan>> fetchPlans() async {
    try {
      final offerings = await Purchases.getOfferings();
      final current   = offerings.current;
      if (current == null) return SubscriptionPlan.defaults;

      return current.availablePackages.map(_packageToPlan).toList();
    } catch (_) {
      return SubscriptionPlan.defaults;
    }
  }

  // ── Purchase a plan ───────────────────────────────────────────────────────

  Future<SubscriptionStatus> purchase(SubscriptionPlan plan) async {
    final offerings = await Purchases.getOfferings();
    final package   = _findPackage(offerings, plan.productId);
    if (package == null) throw Exception('Product not found: ${plan.productId}');

    final info = await Purchases.purchasePackage(package);
    return _mapStatus(info);
  }

  // ── Check current subscription status ────────────────────────────────────

  Future<SubscriptionStatus> getStatus() async {
    try {
      final info = await Purchases.getCustomerInfo();
      return _mapStatus(info);
    } catch (_) {
      return SubscriptionStatus.inactive;
    }
  }

  // ── Restore purchases (required by App Store guidelines) ─────────────────

  Future<SubscriptionStatus> restorePurchases() async {
    final info = await Purchases.restorePurchases();
    return _mapStatus(info);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  SubscriptionPlan _packageToPlan(Package pkg) {
    final product  = pkg.storeProduct;
    final isAnnual = pkg.packageType == PackageType.annual;

    // Calculate per-month price for annual plan
    String perMonth = product.priceString;
    if (isAnnual) {
      final monthly = product.price / 12;
      perMonth      = '\$${monthly.toStringAsFixed(2)}/mo';
    } else {
      perMonth = '${product.priceString}/mo';
    }

    return SubscriptionPlan(
      productId:     product.identifier,
      interval:      isAnnual ? PlanInterval.annual : PlanInterval.monthly,
      price:         product.priceString,
      pricePerMonth: perMonth,
      title:         isAnnual ? 'Annual' : 'Monthly',
      badge:         isAnnual ? 'Save 17%' : null,
    );
  }

  Package? _findPackage(Offerings offerings, String productId) {
    final current = offerings.current;
    if (current == null) return null;
    try {
      return current.availablePackages
          .firstWhere((p) => p.storeProduct.identifier == productId);
    } catch (_) {
      return null;
    }
  }

  SubscriptionStatus _mapStatus(CustomerInfo info) {
    final entitlement = info.entitlements.all[RCEntitlements.premium];
    final isActive    = entitlement?.isActive ?? false;

    if (!isActive) return SubscriptionStatus.inactive;

    final productId = entitlement!.productIdentifier;
    final expiresAt = entitlement.expirationDate != null
        ? DateTime.tryParse(entitlement.expirationDate!)
        : null;

    // RevenueCat marks trial purchases with periodType == 'TRIAL'
    final isTrial = entitlement.periodType == PeriodType.trial;

    return SubscriptionStatus(
      isActive:        true,
      isTrial:         isTrial,
      activeProductId: productId,
      expiresAt:       expiresAt,
    );
  }
}
