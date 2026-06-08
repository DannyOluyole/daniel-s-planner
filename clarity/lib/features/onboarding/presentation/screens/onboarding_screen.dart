// lib/features/onboarding/presentation/screens/onboarding_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/router/app_router.dart';
import '../../application/onboarding_provider.dart';

class _OnboardStep {
  const _OnboardStep({required this.icon, required this.title, required this.description});
  final IconData icon;
  final String   title;
  final String   description;
}

const _steps = [
  _OnboardStep(icon: TablerIcons.shield_lock, title: 'Block what drains you',
      description: 'Set limits on apps and websites that pull you away from what actually matters.'),
  _OnboardStep(icon: TablerIcons.clock_stop, title: 'Track your screen time',
      description: 'See exactly where your hours go. Awareness is the first step to change.'),
  _OnboardStep(icon: TablerIcons.users, title: "You're not alone in this",
      description: 'A community of people working through the same things. Support when you need it most.'),
  _OnboardStep(icon: TablerIcons.heart, title: 'Build better habits',
      description: 'Streaks, check-ins, and a daily companion that keeps you honest.'),
];

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});
  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen>
    with SingleTickerProviderStateMixin {
  int _step = 0;
  late final AnimationController _animController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 280));
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _animController.value = 1;
  }

  @override
  void dispose() { _animController.dispose(); super.dispose(); }

  Future<void> _next() async {
    if (_step < _steps.length - 1) {
      await _animController.reverse();
      setState(() => _step++);
      await _animController.forward();
    } else {
      await _finish();
    }
  }

  Future<void> _finish() async {
    await ref.read(onboardingNotifierProvider.notifier).markComplete();
    if (mounted) context.go(Routes.home);
  }

  @override
  Widget build(BuildContext context) {
    final step   = _steps[_step];
    final isLast = _step == _steps.length - 1;
    return Scaffold(
      backgroundColor: ClarityColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 24),
              _AppLogo(),
              const SizedBox(height: 20),
              _StepDots(total: _steps.length, current: _step),
              const Spacer(),
              FadeTransition(
                opacity: _fadeAnim,
                child: Column(
                  children: [
                    _IconCircle(icon: step.icon),
                    const SizedBox(height: 28),
                    Text(step.title, textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w500,
                            color: ClarityColors.textPrimary, height: 1.3)),
                    const SizedBox(height: 14),
                    Text(step.description, textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 14, color: ClarityColors.textFaint, height: 1.6)),
                  ],
                ),
              ),
              const Spacer(),
              ElevatedButton(onPressed: _next, child: Text(isLast ? 'Get started' : 'Continue')),
              const SizedBox(height: 14),
              GestureDetector(
                onTap: _finish,
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Text('Skip', style: TextStyle(fontSize: 13, color: ClarityColors.textDisabled)),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _AppLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Column(children: [
    Container(width: 56, height: 56,
        decoration: BoxDecoration(color: ClarityColors.purpleDeep, borderRadius: BorderRadius.circular(16)),
        child: const Icon(TablerIcons.leaf, color: ClarityColors.purplePale, size: 26)),
    const SizedBox(height: 10),
    const Text('CLARITY', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
        color: ClarityColors.purple, letterSpacing: 0.08 * 13)),
  ]);
}

class _StepDots extends StatelessWidget {
  const _StepDots({required this.total, required this.current});
  final int total, current;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: List.generate(total, (i) {
      final active = i == current;
      return AnimatedContainer(
        duration: const Duration(milliseconds: 300), curve: Curves.easeInOut,
        margin: const EdgeInsets.symmetric(horizontal: 3),
        width: active ? 20 : 6, height: 6,
        decoration: BoxDecoration(
          color: active ? ClarityColors.purpleLight : ClarityColors.border,
          borderRadius: BorderRadius.circular(3)),
      );
    }),
  );
}

class _IconCircle extends StatelessWidget {
  const _IconCircle({required this.icon});
  final IconData icon;
  @override
  Widget build(BuildContext context) => Container(
    width: 88, height: 88,
    decoration: BoxDecoration(color: ClarityColors.bgCard, shape: BoxShape.circle,
        border: Border.all(color: ClarityColors.border, width: 0.5)),
    child: Icon(icon, size: 38, color: ClarityColors.purpleLight),
  );
}
