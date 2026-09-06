import 'package:flutter_test/flutter_test.dart';
import 'package:miqra/main.dart';

void main() {
  testWidgets('Miqra app boots', (WidgetTester tester) async {
    await tester.pumpWidget(const MiqraApp());
    expect(find.text('Miqra'), findsWidgets);
  });
}
