// lib/firebase_options.dart
//
// Configuration for the "clarity-app-df280" Firebase project.
//
// ignore_for_file: lines_longer_than_80_chars
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'DefaultFirebaseOptions have not been configured for web.',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for iOS.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDSwxp9fZBAegh5Ehr_vTAZ4klkZNFoCUo',
    appId: '1:489895201925:android:f655da66214de3d9e5edec',
    messagingSenderId: '489895201925',
    projectId: 'clarity-app-df280',
    storageBucket: 'clarity-app-df280.firebasestorage.app',
  );
}
