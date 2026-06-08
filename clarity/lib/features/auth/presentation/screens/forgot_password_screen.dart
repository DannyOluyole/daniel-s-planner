// lib/features/auth/presentation/screens/forgot_password_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../../application/auth_provider.dart';
import '../widgets/auth_text_field.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool  _sent      = false;
  bool  _loading   = false;

  @override
  void dispose() { _emailCtrl.dispose(); super.dispose(); }

  Future<void> _send() async {
    setState(() => _loading = true);
    await ref.read(authNotifierProvider.notifier)
        .sendPasswordReset(_emailCtrl.text.trim());
    setState(() { _loading = false; _sent = true; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ClarityColors.bg,
      appBar: AppBar(
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: const Icon(TablerIcons.arrow_left, color: ClarityColors.textPrimary),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: _sent ? _SuccessState() : _FormState(
          controller: _emailCtrl,
          loading: _loading,
          onSend: _send,
        ),
      ),
    );
  }
}

class _FormState extends StatelessWidget {
  const _FormState({required this.controller, required this.loading, required this.onSend});
  final TextEditingController controller;
  final bool loading;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        const Text('Reset password', style: TextStyle(fontSize: 24,
            fontWeight: FontWeight.w500, color: ClarityColors.textPrimary)),
        const SizedBox(height: 6),
        const Text("Enter your email and we'll send a reset link.",
            style: TextStyle(fontSize: 14, color: ClarityColors.textFaint)),
        const SizedBox(height: 28),
        AuthTextField(controller: controller, label: 'Email',
            hint: 'you@example.com', keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: loading ? null : onSend,
          child: loading
              ? const SizedBox(width: 20, height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: ClarityColors.textPrimary))
              : const Text('Send reset link'),
        ),
      ],
    );
  }
}

class _SuccessState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 72, height: 72,
          decoration: const BoxDecoration(color: ClarityColors.tealTint, shape: BoxShape.circle),
          child: const Icon(TablerIcons.mail_check, size: 32, color: ClarityColors.teal),
        ),
        const SizedBox(height: 20),
        const Text('Check your inbox', style: TextStyle(fontSize: 20,
            fontWeight: FontWeight.w500, color: ClarityColors.textPrimary)),
        const SizedBox(height: 8),
        const Text("We've sent a password reset link to your email.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: ClarityColors.textFaint, height: 1.6)),
        const SizedBox(height: 28),
        ElevatedButton(
          onPressed: () => context.pop(),
          child: const Text('Back to sign in'),
        ),
      ],
    );
  }
}
