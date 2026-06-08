import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kOnboardingSeen = 'onboarding_seen';

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('Override sharedPreferencesProvider in main()');
});

final onboardingSeenProvider =
    StateNotifierProvider<OnboardingSeenNotifier, bool>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return OnboardingSeenNotifier(prefs);
});

class OnboardingSeenNotifier extends StateNotifier<bool> {
  OnboardingSeenNotifier(this._prefs)
      : super(_prefs.getBool(_kOnboardingSeen) ?? false);

  final SharedPreferences _prefs;

  Future<void> markSeen() async {
    await _prefs.setBool(_kOnboardingSeen, true);
    state = true;
  }
}
