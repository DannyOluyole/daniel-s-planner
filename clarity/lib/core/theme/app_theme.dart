// lib/core/theme/app_theme.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ─── Colour tokens (mirrored from prototype CSS) ────────────────────────────

class ClarityColors {
  ClarityColors._();

  // Backgrounds
  static const bg          = Color(0xFF0A0A0F); // deepest background
  static const bgSurface   = Color(0xFF0E0E14); // body bg
  static const bgCard      = Color(0xFF13131F); // card / input bg
  static const bgElevated  = Color(0xFF1E1E2E); // hover / elevated
  static const bgInput     = Color(0xFF1A1A26); // text field bg

  // Borders
  static const borderFaint = Color(0xFF1E1E28);
  static const border      = Color(0xFF2A2A3A);

  // Purple brand
  static const purple      = Color(0xFF534AB7); // primary action
  static const purpleLight = Color(0xFF7F77DD); // icons / active tab
  static const purplePale  = Color(0xFFAFA9EC); // label text
  static const purpleDeep  = Color(0xFF2D2875); // avatar bg
  static const purpleTint  = Color(0xFF1A1528); // card tint

  // Teal / green accent
  static const teal        = Color(0xFF1D9E75);
  static const tealDark    = Color(0xFF0F6E56);
  static const tealLight   = Color(0xFF5DCAA5);
  static const tealTint    = Color(0xFF0F1A13);

  // Amber accent
  static const amber       = Color(0xFFEF9F27);
  static const amberTint   = Color(0xFF1A1408);

  // Red / danger
  static const red         = Color(0xFFE24B4A);
  static const redDark     = Color(0xFFA32D2D);
  static const redLight    = Color(0xFFF09595);
  static const redTint     = Color(0xFF1A1010);

  // Pink (like / heart)
  static const pink        = Color(0xFFED93B1);

  // Text
  static const textPrimary   = Color(0xFFE8E8F2);
  static const textSecondary = Color(0xFFC8C8D8);
  static const textMuted     = Color(0xFF888899);
  static const textFaint     = Color(0xFF666677);
  static const textDisabled  = Color(0xFF444455);
}

// ─── ThemeData ───────────────────────────────────────────────────────────────

class AppTheme {
  AppTheme._();

  static ThemeData get dark {
    final base = ThemeData.dark(useMaterial3: true);

    return base.copyWith(
      scaffoldBackgroundColor: ClarityColors.bgSurface,
      colorScheme: const ColorScheme.dark(
        primary:   ClarityColors.purple,
        secondary: ClarityColors.teal,
        surface:   ClarityColors.bgCard,
        error:     ClarityColors.red,
        onPrimary: ClarityColors.textPrimary,
        onSurface: ClarityColors.textPrimary,
      ),
      textTheme: GoogleFonts.interTextTheme(base.textTheme).copyWith(
        bodyLarge:    const TextStyle(color: ClarityColors.textPrimary,   fontSize: 15),
        bodyMedium:   const TextStyle(color: ClarityColors.textSecondary, fontSize: 13),
        bodySmall:    const TextStyle(color: ClarityColors.textMuted,     fontSize: 12),
        labelSmall:   const TextStyle(color: ClarityColors.textDisabled,  fontSize: 11, letterSpacing: 0.06),
        titleMedium:  const TextStyle(color: ClarityColors.textPrimary,   fontSize: 18, fontWeight: FontWeight.w500),
        titleLarge:   const TextStyle(color: ClarityColors.textPrimary,   fontSize: 22, fontWeight: FontWeight.w500),
      ),
      cardTheme: CardTheme(
        color: ClarityColors.bgCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: ClarityColors.border, width: 0.5),
        ),
        elevation: 0,
        margin: EdgeInsets.zero,
      ),
      dividerTheme: const DividerThemeData(
        color: ClarityColors.borderFaint,
        thickness: 0.5,
        space: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: ClarityColors.bgInput,
        hintStyle: const TextStyle(color: ClarityColors.textDisabled, fontSize: 13),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: ClarityColors.border, width: 0.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: ClarityColors.border, width: 0.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: ClarityColors.purple, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ClarityColors.purple,
          foregroundColor: ClarityColors.textPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          padding: const EdgeInsets.symmetric(vertical: 16),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
          elevation: 0,
          minimumSize: const Size(double.infinity, 52),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: ClarityColors.bg,
        indicatorColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final active = states.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 10,
            color: active ? ClarityColors.purpleLight : ClarityColors.textDisabled,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final active = states.contains(WidgetState.selected);
          return IconThemeData(
            size: 22,
            color: active ? ClarityColors.purpleLight : ClarityColors.textDisabled,
          );
        }),
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.transparent,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: ClarityColors.textPrimary,
          fontSize: 17,
          fontWeight: FontWeight.w500,
        ),
        iconTheme: IconThemeData(color: ClarityColors.textPrimary),
      ),
    );
  }
}
