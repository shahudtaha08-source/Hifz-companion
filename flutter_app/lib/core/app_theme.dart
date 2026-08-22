import 'package:flutter/material.dart';

class AppTheme {
  static const seed = Color(0xFF2F6B4F);

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.light),
        scaffoldBackgroundColor: const Color(0xFFFBF8F2),
        navigationBarTheme: const NavigationBarThemeData(height: 72),
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.dark),
        scaffoldBackgroundColor: const Color(0xFF0F1512),
        navigationBarTheme: const NavigationBarThemeData(height: 72),
      );
}
