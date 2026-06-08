// lib/features/auth/presentation/widgets/auth_text_field.dart
import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class AuthTextField extends StatelessWidget {
  const AuthTextField({
    super.key,
    required this.controller,
    required this.label,
    required this.hint,
    this.keyboardType = TextInputType.text,
    this.obscure      = false,
    this.suffix,
  });

  final TextEditingController controller;
  final String                label;
  final String                hint;
  final TextInputType         keyboardType;
  final bool                  obscure;
  final Widget?               suffix;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500,
                color: ClarityColors.textSecondary)),
        const SizedBox(height: 6),
        TextField(
          controller:      controller,
          keyboardType:    keyboardType,
          obscureText:     obscure,
          style: const TextStyle(color: ClarityColors.textPrimary, fontSize: 14),
          decoration: InputDecoration(
            hintText:    hint,
            suffixIcon:  suffix != null
                ? Padding(padding: const EdgeInsets.only(right: 12), child: suffix)
                : null,
            suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
          ),
        ),
      ],
    );
  }
}
