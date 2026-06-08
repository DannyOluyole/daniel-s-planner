// lib/main.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'core/router/app_router.dart';
import 'firebase_options.dart';
import 'features/paywall/data/purchase_repository.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (_) {}

  try {
    await PurchaseRepository.configure(appUserId: 'anonymous');
  } catch (_) {}

  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(const ProviderScope(child: ClarityApp()));
}

class ClarityApp extends ConsumerWidget {
  const ClarityApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router    = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeProvider);
    final isDark    = themeMode == ThemeMode.dark;

    // Update global colour accessor so all widgets see the right palette
    ct = isDark ? ClarityColors.dark : ClarityColors.light;

    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
    ));

    return MaterialApp.router(
      title:                  'Clarity',
      debugShowCheckedModeBanner: false,
      theme:                  AppTheme.light,
      darkTheme:              AppTheme.dark,
      themeMode:              themeMode,
      routerConfig:           router,
    );
  }
}
