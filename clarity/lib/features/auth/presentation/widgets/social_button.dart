// lib/features/auth/presentation/widgets/social_button.dart
import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class SocialButton extends StatelessWidget {
  const SocialButton({
    super.key,
    required this.icon,
    required this.label,
    this.onTap,
  });

  final IconData     icon;
  final String       label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedOpacity(
        opacity: onTap == null ? 0.5 : 1.0,
        duration: const Duration(milliseconds: 150),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: ct.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: ct.border, width: 0.5),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 20, color: ct.textSecondary),
              const SizedBox(width: 10),
              Text(label,
                  style: TextStyle(fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: ct.textSecondary)),
            ],
          ),
        ),
      ),
    );
  }
}
