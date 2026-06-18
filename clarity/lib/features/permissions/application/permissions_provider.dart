// lib/features/permissions/application/permissions_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../block/application/block_settings_notifier.dart';
import '../../block/platform/blocking_channel.dart';

class PermissionsState {
  const PermissionsState({
    this.hasUsage         = false,
    this.hasAccessibility = false,
    this.hasVpn           = false,
    this.isChecking       = false,
  });

  final bool hasUsage;
  final bool hasAccessibility;
  final bool hasVpn;
  final bool isChecking;

  bool get allGranted => hasUsage && hasAccessibility && hasVpn;
  int  get grantedCount => [hasUsage, hasAccessibility, hasVpn].where((b) => b).length;

  PermissionsState copyWith({
    bool? hasUsage, bool? hasAccessibility, bool? hasVpn, bool? isChecking,
  }) => PermissionsState(
    hasUsage:         hasUsage         ?? this.hasUsage,
    hasAccessibility: hasAccessibility ?? this.hasAccessibility,
    hasVpn:           hasVpn           ?? this.hasVpn,
    isChecking:       isChecking       ?? this.isChecking,
  );
}

class PermissionsNotifier extends Notifier<PermissionsState> {
  @override
  PermissionsState build() {
    _refresh();
    return const PermissionsState(isChecking: true);
  }

  Future<void> _refresh() async {
    state = state.copyWith(isChecking: true);
    final usage  = await BlockingChannel.hasUsagePermission();
    final access = await BlockingChannel.hasAccessibilityPermission();
    final vpn    = await BlockingChannel.hasVpnPermission();
    state = PermissionsState(
      hasUsage: usage, hasAccessibility: access, hasVpn: vpn, isChecking: false,
    );
  }

  Future<void> refresh() => _refresh();

  Future<void> requestUsage() async {
    await BlockingChannel.requestUsagePermission();
    // Re-check after user returns from settings
    await Future.delayed(const Duration(seconds: 1));
    await _refresh();
  }

  Future<void> requestAccessibility() async {
    await BlockingChannel.requestAccessibilityPermission();
    await Future.delayed(const Duration(seconds: 1));
    await _refresh();
  }

  Future<void> requestVpn() async {
    await BlockingChannel.requestVpnPermission();
    await Future.delayed(const Duration(milliseconds: 500));
    await _refresh();
    if (state.hasVpn) {
      final keywords = ref.read(blockSettingsProvider).valueOrNull?.keywords ?? const [];
      if (keywords.isNotEmpty) await BlockingChannel.startVpn();
    }
  }
}

final permissionsProvider =
    NotifierProvider<PermissionsNotifier, PermissionsState>(PermissionsNotifier.new);
