import 'package:anantha/theme.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('brand tokens are stable', () {
    expect(Brand.midnight.toARGB32(), 0xFF0F0F1E);
    expect(Brand.lavender.toARGB32(), 0xFF9D88FF);
  });
}
