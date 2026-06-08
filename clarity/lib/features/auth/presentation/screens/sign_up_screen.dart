// lib/features/auth/presentation/screens/sign_up_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/router/app_router.dart';
import '../../application/auth_provider.dart';
import '../widgets/auth_text_field.dart';
import '../widgets/auth_shared.dart';
import '../widgets/social_button.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _nameCtrl     = TextEditingController();
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool  _obscure      = true;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _signUp() async {
    final ok = await ref.read(authNotifierProvider.notifier).signUp(
      email:       _emailCtrl.text.trim(),
      password:    _passwordCtrl.text,
      displayName: _nameCtrl.text.trim(),
    );
    if (ok && mounted) context.go(Routes.home);
  }

  Future<void> _google() async {
    final ok = await ref.read(authNotifierProvider.notifier).signInWithGoogle();
    if (ok && mounted) context.go(Routes.home);
  }

  Future<void> _apple() async {
    final ok = await ref.read(authNotifierProvider.notifier).signInWithApple();
    if (ok && mounted) context.go(Routes.home);
  }

  @override
  Widget build(BuildContext context) {
    final auth    = ref.watch(authNotifierProvider);
    final loading = auth.isLoading;

    return Scaffold(
      backgroundColor: ct.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 40),
              const ClarityAuthLogo(),
              const SizedBox(height: 32),

              Text('Create your account',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w500,
                      color: ct.textPrimary)),
              const SizedBox(height: 6),
              Text('Start your journey to a clearer mind.',
                  style: TextStyle(fontSize: 14, color: ct.textFaint)),
              const SizedBox(height: 28),

              AuthTextField(
                controller: _nameCtrl,
                label: 'Name',
                hint: 'Danny Kay',
                keyboardType: TextInputType.name,
              ),
              const SizedBox(height: 12),
              AuthTextField(
                controller: _emailCtrl,
                label: 'Email',
                hint: 'you@example.com',
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              AuthTextField(
                controller: _passwordCtrl,
                label: 'Password',
                hint: 'At least 6 characters',
                obscure: _obscure,
                suffix: GestureDetector(
                  onTap: () => setState(() => _obscure = !_obscure),
                  child: Icon(
                    _obscure ? TablerIcons.eye : TablerIcons.eye_off,
                    size: 18, color: ct.textDisabled,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              if (auth.errorMsg != null && auth.errorMsg!.isNotEmpty)
                AuthErrorBanner(message: auth.errorMsg!),

              ElevatedButton(
                onPressed: loading ? null : _signUp,
                child: loading
                    ? SizedBox(width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2,
                            color: ct.textPrimary))
                    : const Text('Create account'),
              ),
              const SizedBox(height: 20),
              const AuthOrDivider(),
              const SizedBox(height: 20),

              SocialButton(
                icon: TablerIcons.brand_apple,
                label: 'Continue with Apple',
                onTap: loading ? null : _apple,
              ),
              const SizedBox(height: 10),
              SocialButton(
                icon: TablerIcons.brand_google,
                label: 'Continue with Google',
                onTap: loading ? null : _google,
              ),
              const SizedBox(height: 28),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Already have an account?',
                      style: TextStyle(fontSize: 13, color: ct.textDisabled)),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Text('Sign in',
                        style: TextStyle(fontSize: 13, color: ct.purpleLight,
                            fontWeight: FontWeight.w500)),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
