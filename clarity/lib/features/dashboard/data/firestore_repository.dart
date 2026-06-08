// lib/features/dashboard/data/firestore_repository.dart
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../auth/domain/clarity_user.dart';
import '../domain/streak_model.dart';

class FirestoreRepository {
  FirestoreRepository({FirebaseFirestore? db})
      : _db = db ?? FirebaseFirestore.instance;

  final FirebaseFirestore _db;

  // ── Collection refs ───────────────────────────────────────────────────────

  CollectionReference<Map<String, dynamic>> get _users =>
      _db.collection('users');

  DocumentReference<Map<String, dynamic>> _userDoc(String uid) =>
      _users.doc(uid);

  DocumentReference<Map<String, dynamic>> _streakDoc(String uid) =>
      _users.doc(uid).collection('data').doc('streak');

  // ── User document ─────────────────────────────────────────────────────────

  Future<void> createUserDoc(ClarityUser user) async {
    final ref = _userDoc(user.uid);
    final snap = await ref.get();
    if (snap.exists) return; // don't overwrite existing user

    await ref.set({
      ...user.toFirestore(),
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  Future<void> upsertUserDoc(ClarityUser user) async {
    await _userDoc(user.uid).set(
      {
        'email':       user.email,
        'displayName': user.displayName,
        'photoUrl':    user.photoUrl,
        'lastSeenAt':  FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );
  }

  // ── Streak — realtime stream ───────────────────────────────────────────────

  Stream<StreakModel> streakStream(String uid) {
    return _streakDoc(uid).snapshots().map((snap) {
      if (!snap.exists || snap.data() == null) return StreakModel.empty;
      return StreakModel.fromJson(snap.data()!);
    });
  }

  // ── Streak — write ────────────────────────────────────────────────────────

  Future<void> saveStreak(String uid, StreakModel model) async {
    await _streakDoc(uid).set(
      {
        ...model.toJson(),
        'updatedAt': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );
  }

  /// Atomic increment for blocks — safe for concurrent writes
  Future<void> incrementBlocks(String uid) async {
    await _streakDoc(uid).set(
      {
        'totalBlocksAllTime': FieldValue.increment(1),
        'updatedAt':          FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );
  }

  /// Check-in — sets today's bar to 1.0 and increments streak atomically
  Future<void> checkIn(String uid, {
    required int  newStreak,
    required int  bestStreak,
    required int  dayIndex,
  }) async {
    await _streakDoc(uid).set(
      {
        'currentStreak':   newStreak,
        'bestStreak':      bestStreak,
        'lastCheckInDate': DateTime.now().toIso8601String(),
        'weeklyData.$dayIndex': 1.0,
        'updatedAt': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );
  }

  // ── Migration — push local SharedPrefs streak up to Firestore once ────────

  Future<void> migrateLocalStreak(String uid, StreakModel local) async {
    final snap = await _streakDoc(uid).get();
    if (snap.exists) return; // cloud already has data — skip
    await saveStreak(uid, local);
  }
}
