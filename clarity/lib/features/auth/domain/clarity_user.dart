// lib/features/auth/domain/clarity_user.dart

class ClarityUser {
  const ClarityUser({
    required this.uid,
    required this.email,
    this.displayName,
    this.photoUrl,
    this.createdAt,
  });

  final String    uid;
  final String    email;
  final String?   displayName;
  final String?   photoUrl;
  final DateTime? createdAt;

  /// Initials for the avatar — "Danny Kay" → "DK"
  String get initials {
    if (displayName == null || displayName!.isEmpty) {
      return email.substring(0, 1).toUpperCase();
    }
    final parts = displayName!.trim().split(' ');
    if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
    return (parts[0].substring(0, 1) + parts.last.substring(0, 1)).toUpperCase();
  }

  String get firstName {
    if (displayName == null || displayName!.isEmpty) return 'there';
    return displayName!.trim().split(' ').first;
  }

  ClarityUser copyWith({
    String?   displayName,
    String?   photoUrl,
  }) {
    return ClarityUser(
      uid:         uid,
      email:       email,
      displayName: displayName ?? this.displayName,
      photoUrl:    photoUrl    ?? this.photoUrl,
      createdAt:   createdAt,
    );
  }

  Map<String, dynamic> toFirestore() => {
    'uid':         uid,
    'email':       email,
    'displayName': displayName,
    'photoUrl':    photoUrl,
    'createdAt':   createdAt?.toIso8601String(),
  };

  factory ClarityUser.fromFirestore(Map<String, dynamic> doc) => ClarityUser(
    uid:         doc['uid']         as String,
    email:       doc['email']       as String,
    displayName: doc['displayName'] as String?,
    photoUrl:    doc['photoUrl']    as String?,
    createdAt:   doc['createdAt'] != null
        ? DateTime.tryParse(doc['createdAt'] as String)
        : null,
  );
}
