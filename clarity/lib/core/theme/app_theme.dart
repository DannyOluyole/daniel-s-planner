// lib/core/theme/app_theme.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ─── Global colour accessor — updated by ClarityApp on every build ───────────
// All widgets use `ct.bgSurface` etc. directly without needing BuildContext.
// ignore: library_private_types_in_public_api
ClarityColors ct = ClarityColors.light;

// ─── ClarityColors — ThemeExtension with light + dark instances ──────────────

class ClarityColors extends ThemeExtension<ClarityColors> {
  const ClarityColors({
    required this.bg,
    required this.bgSurface,
    required this.bgCard,
    required this.bgElevated,
    required this.bgInput,
    required this.borderFaint,
    required this.border,
    required this.primary,
    required this.primaryLight,
    required this.primaryPale,
    required this.primaryDeep,
    required this.primaryTint,
    required this.teal,
    required this.tealDark,
    required this.tealLight,
    required this.tealTint,
    required this.amber,
    required this.amberTint,
    required this.red,
    required this.redDark,
    required this.redLight,
    required this.redTint,
    required this.pink,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.textFaint,
    required this.textDisabled,
    required this.navBg,
    required this.isDark,
  });

  final Color bg;
  final Color bgSurface;
  final Color bgCard;
  final Color bgElevated;
  final Color bgInput;
  final Color borderFaint;
  final Color border;
  final Color primary;
  final Color primaryLight;
  final Color primaryPale;
  final Color primaryDeep;
  final Color primaryTint;
  final Color teal;
  final Color tealDark;
  final Color tealLight;
  final Color tealTint;
  final Color amber;
  final Color amberTint;
  final Color red;
  final Color redDark;
  final Color redLight;
  final Color redTint;
  final Color pink;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color textFaint;
  final Color textDisabled;
  final Color navBg;
  final bool  isDark;

  // ── Convenience aliases kept for drop-in compatibility ────────────────────
  Color get purple      => primary;
  Color get purpleLight => primaryLight;
  Color get purplePale  => primaryPale;
  Color get purpleDeep  => primaryDeep;
  Color get purpleTint  => primaryTint;

  // ── Dark palette (original) ───────────────────────────────────────────────
  static const dark = ClarityColors(
    bg:            Color(0xFF0A0A0F),
    bgSurface:     Color(0xFF0E0E14),
    bgCard:        Color(0xFF13131F),
    bgElevated:    Color(0xFF1E1E2E),
    bgInput:       Color(0xFF1A1A26),
    borderFaint:   Color(0xFF1E1E28),
    border:        Color(0xFF2A2A3A),
    primary:       Color(0xFF534AB7),
    primaryLight:  Color(0xFF7F77DD),
    primaryPale:   Color(0xFFAFA9EC),
    primaryDeep:   Color(0xFF2D2875),
    primaryTint:   Color(0xFF1A1528),
    teal:          Color(0xFF1D9E75),
    tealDark:      Color(0xFF0F6E56),
    tealLight:     Color(0xFF5DCAA5),
    tealTint:      Color(0xFF0F1A13),
    amber:         Color(0xFFEF9F27),
    amberTint:     Color(0xFF1A1408),
    red:           Color(0xFFE24B4A),
    redDark:       Color(0xFFA32D2D),
    redLight:      Color(0xFFF09595),
    redTint:       Color(0xFF1A1010),
    pink:          Color(0xFFED93B1),
    textPrimary:   Color(0xFFE8E8F2),
    textSecondary: Color(0xFFC8C8D8),
    textMuted:     Color(0xFF888899),
    textFaint:     Color(0xFF666677),
    textDisabled:  Color(0xFF444455),
    navBg:         Color(0xFF0A0A0F),
    isDark:        true,
  );

  // ── Light palette (white + blue) ──────────────────────────────────────────
  static const light = ClarityColors(
    bg:            Color(0xFFF0F2FF),
    bgSurface:     Color(0xFFFFFFFF),
    bgCard:        Color(0xFFF5F6FF),
    bgElevated:    Color(0xFFEAECFF),
    bgInput:       Color(0xFFF0F2FF),
    borderFaint:   Color(0xFFE8EAFF),
    border:        Color(0xFFD4D6F0),
    primary:       Color(0xFF2563EB),
    primaryLight:  Color(0xFF3B82F6),
    primaryPale:   Color(0xFF93C5FD),
    primaryDeep:   Color(0xFF1E40AF),
    primaryTint:   Color(0xFFEFF6FF),
    teal:          Color(0xFF059669),
    tealDark:      Color(0xFF047857),
    tealLight:     Color(0xFF34D399),
    tealTint:      Color(0xFFECFDF5),
    amber:         Color(0xFFD97706),
    amberTint:     Color(0xFFFFFBEB),
    red:           Color(0xFFDC2626),
    redDark:       Color(0xFFB91C1C),
    redLight:      Color(0xFFFCA5A5),
    redTint:       Color(0xFFFEF2F2),
    pink:          Color(0xFFDB2777),
    textPrimary:   Color(0xFF111827),
    textSecondary: Color(0xFF374151),
    textMuted:     Color(0xFF6B7280),
    textFaint:     Color(0xFF9CA3AF),
    textDisabled:  Color(0xFFD1D5DB),
    navBg:         Color(0xFFFFFFFF),
    isDark:        false,
  );

  @override
  ClarityColors copyWith({
    Color? bg, Color? bgSurface, Color? bgCard, Color? bgElevated, Color? bgInput,
    Color? borderFaint, Color? border, Color? primary, Color? primaryLight,
    Color? primaryPale, Color? primaryDeep, Color? primaryTint,
    Color? teal, Color? tealDark, Color? tealLight, Color? tealTint,
    Color? amber, Color? amberTint, Color? red, Color? redDark,
    Color? redLight, Color? redTint, Color? pink,
    Color? textPrimary, Color? textSecondary, Color? textMuted,
    Color? textFaint, Color? textDisabled, Color? navBg, bool? isDark,
  }) => ClarityColors(
    bg: bg ?? this.bg, bgSurface: bgSurface ?? this.bgSurface,
    bgCard: bgCard ?? this.bgCard, bgElevated: bgElevated ?? this.bgElevated,
    bgInput: bgInput ?? this.bgInput, borderFaint: borderFaint ?? this.borderFaint,
    border: border ?? this.border, primary: primary ?? this.primary,
    primaryLight: primaryLight ?? this.primaryLight, primaryPale: primaryPale ?? this.primaryPale,
    primaryDeep: primaryDeep ?? this.primaryDeep, primaryTint: primaryTint ?? this.primaryTint,
    teal: teal ?? this.teal, tealDark: tealDark ?? this.tealDark,
    tealLight: tealLight ?? this.tealLight, tealTint: tealTint ?? this.tealTint,
    amber: amber ?? this.amber, amberTint: amberTint ?? this.amberTint,
    red: red ?? this.red, redDark: redDark ?? this.redDark,
    redLight: redLight ?? this.redLight, redTint: redTint ?? this.redTint,
    pink: pink ?? this.pink, textPrimary: textPrimary ?? this.textPrimary,
    textSecondary: textSecondary ?? this.textSecondary, textMuted: textMuted ?? this.textMuted,
    textFaint: textFaint ?? this.textFaint, textDisabled: textDisabled ?? this.textDisabled,
    navBg: navBg ?? this.navBg, isDark: isDark ?? this.isDark,
  );

  @override
  ClarityColors lerp(ThemeExtension<ClarityColors>? other, double t) {
    if (other is! ClarityColors) return this;
    return ClarityColors(
      bg:            Color.lerp(bg, other.bg, t)!,
      bgSurface:     Color.lerp(bgSurface, other.bgSurface, t)!,
      bgCard:        Color.lerp(bgCard, other.bgCard, t)!,
      bgElevated:    Color.lerp(bgElevated, other.bgElevated, t)!,
      bgInput:       Color.lerp(bgInput, other.bgInput, t)!,
      borderFaint:   Color.lerp(borderFaint, other.borderFaint, t)!,
      border:        Color.lerp(border, other.border, t)!,
      primary:       Color.lerp(primary, other.primary, t)!,
      primaryLight:  Color.lerp(primaryLight, other.primaryLight, t)!,
      primaryPale:   Color.lerp(primaryPale, other.primaryPale, t)!,
      primaryDeep:   Color.lerp(primaryDeep, other.primaryDeep, t)!,
      primaryTint:   Color.lerp(primaryTint, other.primaryTint, t)!,
      teal:          Color.lerp(teal, other.teal, t)!,
      tealDark:      Color.lerp(tealDark, other.tealDark, t)!,
      tealLight:     Color.lerp(tealLight, other.tealLight, t)!,
      tealTint:      Color.lerp(tealTint, other.tealTint, t)!,
      amber:         Color.lerp(amber, other.amber, t)!,
      amberTint:     Color.lerp(amberTint, other.amberTint, t)!,
      red:           Color.lerp(red, other.red, t)!,
      redDark:       Color.lerp(redDark, other.redDark, t)!,
      redLight:      Color.lerp(redLight, other.redLight, t)!,
      redTint:       Color.lerp(redTint, other.redTint, t)!,
      pink:          Color.lerp(pink, other.pink, t)!,
      textPrimary:   Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textMuted:     Color.lerp(textMuted, other.textMuted, t)!,
      textFaint:     Color.lerp(textFaint, other.textFaint, t)!,
      textDisabled:  Color.lerp(textDisabled, other.textDisabled, t)!,
      navBg:         Color.lerp(navBg, other.navBg, t)!,
      isDark:        t < 0.5 ? isDark : other.isDark,
    );
  }
}

// ─── BuildContext shorthand ───────────────────────────────────────────────────

extension ClarityThemeX on BuildContext {
  ClarityColors get ct => Theme.of(this).extension<ClarityColors>()!;
}

// ─── ThemeData factory ────────────────────────────────────────────────────────

class AppTheme {
  AppTheme._();

  static final ThemeData light = _build(ClarityColors.light);
  static final ThemeData dark  = _build(ClarityColors.dark);

  static ThemeData _build(ClarityColors c) {
    final base     = c.isDark ? ThemeData.dark(useMaterial3: true)
                              : ThemeData.light(useMaterial3: true);
    final textBase = GoogleFonts.interTextTheme(base.textTheme);

    return base.copyWith(
      extensions: [c],
      scaffoldBackgroundColor: c.bgSurface,
      colorScheme: ColorScheme(
        brightness:  c.isDark ? Brightness.dark : Brightness.light,
        primary:     c.primary,
        onPrimary:   c.textPrimary,
        secondary:   c.teal,
        onSecondary: c.textPrimary,
        error:       c.red,
        onError:     Colors.white,
        surface:     c.bgCard,
        onSurface:   c.textPrimary,
      ),
      textTheme: textBase.copyWith(
        bodyLarge:   TextStyle(color: c.textPrimary,   fontSize: 15),
        bodyMedium:  TextStyle(color: c.textSecondary, fontSize: 13),
        bodySmall:   TextStyle(color: c.textMuted,     fontSize: 12),
        labelSmall:  TextStyle(color: c.textDisabled,  fontSize: 11, letterSpacing: 0.06),
        titleMedium: TextStyle(color: c.textPrimary,   fontSize: 18, fontWeight: FontWeight.w500),
        titleLarge:  TextStyle(color: c.textPrimary,   fontSize: 22, fontWeight: FontWeight.w500),
      ),
      cardTheme: CardTheme(
        color: c.bgCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: c.border, width: 0.5),
        ),
        elevation: 0,
        margin: EdgeInsets.zero,
      ),
      dividerTheme: DividerThemeData(
        color: c.borderFaint, thickness: 0.5, space: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.bgInput,
        hintStyle: TextStyle(color: c.textDisabled, fontSize: 13),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: c.border, width: 0.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: c.border, width: 0.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: c.primary, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          padding: const EdgeInsets.symmetric(vertical: 16),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
          elevation: 0,
          minimumSize: const Size(double.infinity, 52),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: c.navBg,
        indicatorColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final active = states.contains(WidgetState.selected);
          return TextStyle(
            fontSize: 10,
            color: active ? c.primaryLight : c.textDisabled,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final active = states.contains(WidgetState.selected);
          return IconThemeData(
            size: 22,
            color: active ? c.primaryLight : c.textDisabled,
          );
        }),
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.transparent,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: c.textPrimary,
          fontSize: 17,
          fontWeight: FontWeight.w500,
        ),
        iconTheme: IconThemeData(color: c.textPrimary),
      ),
    );
  }
}
