// lib/features/auth/presentation/screens/sign_in_screen.dart
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

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool  _obscure      = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    final ok = await ref.read(authNotifierProvider.notifier).signIn(
      email:    _emailCtrl.text.trim(),
      password: _passwordCtrl.text,
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

              // ── Logo ──
              const ClarityAuthLogo(),
              const SizedBox(height: 32),

              Text('Welcome back',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w500,
                      color: ct.textPrimary)),
              const SizedBox(height: 6),
              Text('Sign in to continue your progress.',
                  style: TextStyle(fontSize: 14, color: ct.textFaint)),
              const SizedBox(height: 28),

              // ── Email / password ──
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
                hint: '••••••••',
                obscure: _obscure,
                suffix: GestureDetector(
                  onTap: () => setState(() => _obscure = !_obscure),
                  child: Icon(
                    _obscure ? TablerIcons.eye : TablerIcons.eye_off,
                    size: 18, color: ct.textDisabled,
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // ── Forgot password ──
              Align(
                alignment: Alignment.centerRight,
                child: GestureDetector(
                  onTap: () => context.push(Routes.forgotPassword),
                  child: Text('Forgot password?',
                      style: TextStyle(fontSize: 12, color: ct.purpleLight)),
                ),
              ),
              const SizedBox(height: 20),

              // ── Error message ──
              if (auth.errorMsg != null && auth.errorMsg!.isNotEmpty)
                AuthErrorBanner(message: auth.errorMsg!),

              // ── Sign in button ──
              ElevatedButton(
                onPressed: loading ? null : _signIn,
                child: loading
                    ? SizedBox(width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2,
                            color: ct.textPrimary))
                    : const Text('Sign in'),
              ),
              const SizedBox(height: 20),

              // ── Divider ──
              const AuthOrDivider(),
              const SizedBox(height: 20),

              // ── Social buttons ──
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

              // ── Sign up link ──
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text("Don't have an account?",
                      style: TextStyle(fontSize: 13, color: ct.textDisabled)),
                  const SizedBox(width: 4),
                  GestureDetector(
                    onTap: () => context.push(Routes.signUp),
                    child: Text('Sign up',
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

