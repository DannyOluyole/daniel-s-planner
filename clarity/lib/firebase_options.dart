// lib/firebase_options.dart
//
// !! REPLACE THIS FILE !!
// Run the following command in your project root:
//
//   flutterfire configure --project=clarity-app
//
// That command will overwrite this file with your real keys.
// Do NOT commit the real file to a public repo.
//
// ignore_for_file: lines_longer_than_80_chars
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    throw UnimplementedError(
      'Run "flutterfire configure --project=clarity-app" to generate this file.',
    );
  }
}
