import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:clarity/main.dart';

void main() {
  testWidgets('ClarityApp builds without throwing', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: ClarityApp()));
    await tester.pump();

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
