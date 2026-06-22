// lib/features/auth/application/auth_provider.dart
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/auth_repository.dart';
import '../domain/clarity_user.dart';
import '../../dashboard/data/firestore_repository.dart';
import '../../paywall/data/purchase_repository.dart';

// ─── Repository ───────────────────────────────────────────────────────────────

final authRepositoryProvider = Provider<AuthRepository>(
  (_) => AuthRepository(),
);

// ─── Auth state stream — the single source of truth ──────────────────────────
// Rebuilds the whole app whenever sign-in state changes.

final authStateProvider = StreamProvider<ClarityUser?>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});

// ─── Convenience — current user (nullable) ────────────────────────────────────

final currentUserProvider = Provider<ClarityUser?>((ref) {
  return ref.watch(authStateProvider).valueOrNull;
});

// ─── Auth actions notifier ────────────────────────────────────────────────────

enum AuthStatus { idle, loading, success, error }

class AuthState {
  const AuthState({
    this.status  = AuthStatus.idle,
    this.errorMsg,
  });
  final AuthStatus status;
  final String?    errorMsg;

  bool get isLoading => status == AuthStatus.loading;

  AuthState copyWith({AuthStatus? status, String? errorMsg}) => AuthState(
    status:   status   ?? this.status,
    errorMsg: errorMsg ?? this.errorMsg,
  );
}

class AuthNotifier extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState();

  AuthRepository get _repo => ref.read(authRepositoryProvider);

  // ── Email sign-up ─────────────────────────────────────────────────────────

  Future<bool> signUp({
    required String email,
    required String password,
    required String displayName,
  }) async {
    state = const AuthState(status: AuthStatus.loading);
    try {
      final user = await _repo.signUpWithEmail(
        email: email, password: password, displayName: displayName,
      );
      try {
        await ref.read(firestoreUserRepositoryProvider).createUserDoc(user);
      } catch (_) {
        // The auth account was created either way — don't block sign-up on a
        // Firestore write failure (e.g. rules misconfigured).
      }
      await _rcLogin(user.uid);
      state = const AuthState(status: AuthStatus.success);
      return true;
    } catch (e) {
      state = AuthState(status: AuthStatus.error, errorMsg: _message(e));
      return false;
    }
  }

  // ── Email sign-in ─────────────────────────────────────────────────────────

  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    state = const AuthState(status: AuthStatus.loading);
    try {
      final user = await _repo.signInWithEmail(email: email, password: password);
      await _rcLogin(user.uid);
      state = const AuthState(status: AuthStatus.success);
      return true;
    } catch (e) {
      state = AuthState(status: AuthStatus.error, errorMsg: _message(e));
      return false;
    }
  }

  // ── Google ────────────────────────────────────────────────────────────────

  Future<bool> signInWithGoogle() async {
    state = const AuthState(status: AuthStatus.loading);
    try {
      final user = await _repo.signInWithGoogle();
      try {
        await ref.read(firestoreUserRepositoryProvider).upsertUserDoc(user);
      } catch (_) {}
      await _rcLogin(user.uid);
      state = const AuthState(status: AuthStatus.success);
      return true;
    } catch (e) {
      state = AuthState(status: AuthStatus.error, errorMsg: _message(e));
      return false;
    }
  }

  // ── Apple ─────────────────────────────────────────────────────────────────

  Future<bool> signInWithApple() async {
    state = const AuthState(status: AuthStatus.loading);
    try {
      final user = await _repo.signInWithApple();
      try {
        await ref.read(firestoreUserRepositoryProvider).upsertUserDoc(user);
      } catch (_) {}
      await _rcLogin(user.uid);
      state = const AuthState(status: AuthStatus.success);
      return true;
    } catch (e) {
      state = AuthState(status: AuthStatus.error, errorMsg: _message(e));
      return false;
    }
  }

  // ── Password reset ────────────────────────────────────────────────────────

  Future<void> sendPasswordReset(String email) async {
    await _repo.sendPasswordReset(email);
  }

  // ── Sign out ──────────────────────────────────────────────────────────────

  Future<void> signOut() async {
    await _repo.signOut();
    try { await PurchaseRepository.logOut(); } catch (_) {}
    state = const AuthState();
  }

  Future<void> _rcLogin(String uid) async {
    try { await PurchaseRepository.configure(appUserId: uid); } catch (_) {}
  }

  // ── Error message mapper ──────────────────────────────────────────────────

  String _message(Object e) {
    final msg = e.toString();
    if (msg.contains('user-not-found'))    return 'No account found with that email.';
    if (msg.contains('wrong-password'))    return 'Incorrect password.';
    // Newer Firebase projects return this generic code for both a wrong
    // password and a non-existent account (enumeration protection).
    if (msg.contains('invalid-credential')) return 'Incorrect email or password.';
    if (msg.contains('email-already'))     return 'An account already exists with that email.';
    if (msg.contains('invalid-email'))     return 'Please enter a valid email address.';
    if (msg.contains('weak-password'))     return 'Password must be at least 6 characters.';
    if (msg.contains('user-disabled'))     return 'This account has been disabled.';
    if (msg.contains('too-many-requests')) return 'Too many attempts. Try again later.';
    if (msg.contains('network-request'))   return 'No internet connection.';
    if (msg.contains('cancelled'))         return ''; // user cancelled — no toast needed
    debugPrint('Auth error: ${e.runtimeType} $e');
    return 'Something went wrong. Please try again.';
  }
}

final authNotifierProvider =
    NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

// ─── Firestore user repository ────────────────────────────────────────────────
// Thin wrapper that delegates to FirestoreRepository.
// Kept here to avoid re-exporting cloud_firestore types from the auth layer.

final firestoreUserRepositoryProvider =
    Provider<FirestoreUserRepository>((ref) => FirestoreUserRepository());

class FirestoreUserRepository {
  final _repo = FirestoreRepository();
  Future<void> createUserDoc(ClarityUser user) => _repo.createUserDoc(user);
  Future<void> upsertUserDoc(ClarityUser user)  => _repo.upsertUserDoc(user);
}
