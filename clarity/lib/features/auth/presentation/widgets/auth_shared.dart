// lib/features/auth/presentation/widgets/auth_shared.dart
import 'package:flutter/material.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';
import '../../../../core/theme/app_theme.dart';

class ClarityAuthLogo extends StatelessWidget {
  const ClarityAuthLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
              color: ct.purpleDeep,
              borderRadius: BorderRadius.circular(12)),
          child: Icon(TablerIcons.leaf,
              color: ct.purplePale, size: 20),
        ),
        const SizedBox(width: 10),
        Text('PRODUCTIVITY MAX',
            style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: ct.purple,
                letterSpacing: 0.08 * 15)),
      ],
    );
  }
}

class AuthOrDivider extends StatelessWidget {
  const AuthOrDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: Divider(color: ct.border, thickness: 0.5)),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text('or',
              style: TextStyle(fontSize: 12, color: ct.textDisabled)),
        ),
        Expanded(child: Divider(color: ct.border, thickness: 0.5)),
      ],
    );
  }
}

class AuthErrorBanner extends StatelessWidget {
  const AuthErrorBanner({super.key, required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: ct.redTint,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: ct.redDark, width: 0.5),
      ),
      child: Row(
        children: [
          Icon(TablerIcons.alert_circle,
              size: 16, color: ct.red),
          const SizedBox(width: 8),
          Expanded(
              child: Text(message,
                  style: TextStyle(
                      fontSize: 13, color: ct.redLight))),
        ],
      ),
    );
  }
}
