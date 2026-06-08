// lib/features/auth/data/auth_repository.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../domain/clarity_user.dart';

class AuthRepository {
  AuthRepository({
    FirebaseAuth? auth,
    GoogleSignIn? googleSignIn,
  })  : _auth        = auth        ?? FirebaseAuth.instance,
        _googleSignIn = googleSignIn ?? GoogleSignIn();

  final FirebaseAuth  _auth;
  final GoogleSignIn  _googleSignIn;

  // ── Stream ────────────────────────────────────────────────────────────────

  Stream<ClarityUser?> get authStateChanges =>
      _auth.authStateChanges().map(_mapUser);

  ClarityUser? get currentUser => _mapUser(_auth.currentUser);

  // ── Email / password ──────────────────────────────────────────────────────

  Future<ClarityUser> signUpWithEmail({
    required String email,
    required String password,
    String? displayName,
  }) async {
    final cred = await _auth.createUserWithEmailAndPassword(
      email: email, password: password,
    );
    if (displayName != null && displayName.isNotEmpty) {
      await cred.user!.updateDisplayName(displayName);
      await cred.user!.reload();
    }
    return _mapUser(_auth.currentUser)!;
  }

  Future<ClarityUser> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final cred = await _auth.signInWithEmailAndPassword(
      email: email, password: password,
    );
    return _mapUser(cred.user)!;
  }

  Future<void> sendPasswordReset(String email) =>
      _auth.sendPasswordResetEmail(email: email);

  // ── Google ────────────────────────────────────────────────────────────────

  Future<ClarityUser> signInWithGoogle() async {
    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) throw const _SignInCancelled();

    final googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken:     googleAuth.idToken,
    );
    final cred = await _auth.signInWithCredential(credential);
    return _mapUser(cred.user)!;
  }

  // ── Apple ─────────────────────────────────────────────────────────────────

  Future<ClarityUser> signInWithApple() async {
    final appleCredential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
    );

    final oauthCredential = OAuthProvider('apple.com').credential(
      idToken:     appleCredential.identityToken,
      accessToken: appleCredential.authorizationCode,
    );

    final cred = await _auth.signInWithCredential(oauthCredential);

    // Apple only sends the name on first sign-in — persist it
    final fullName = [
      appleCredential.givenName,
      appleCredential.familyName,
    ].where((s) => s != null && s.isNotEmpty).join(' ');

    if (fullName.isNotEmpty && cred.user?.displayName == null) {
      await cred.user!.updateDisplayName(fullName);
      await cred.user!.reload();
    }

    return _mapUser(_auth.currentUser)!;
  }

  // ── Sign out ──────────────────────────────────────────────────────────────

  Future<void> signOut() async {
    await Future.wait([
      _auth.signOut(),
      _googleSignIn.signOut(),
    ]);
  }

  // ── Mapper ────────────────────────────────────────────────────────────────

  ClarityUser? _mapUser(User? user) {
    if (user == null) return null;
    return ClarityUser(
      uid:         user.uid,
      email:       user.email ?? '',
      displayName: user.displayName,
      photoUrl:    user.photoURL,
      createdAt:   user.metadata.creationTime,
    );
  }
}

class _SignInCancelled implements Exception {
  const _SignInCancelled();
  @override
  String toString() => 'Sign-in cancelled';
}
