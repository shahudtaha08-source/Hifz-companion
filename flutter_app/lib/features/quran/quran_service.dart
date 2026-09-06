import 'dart:convert';

import 'package:flutter/services.dart';

class AyahData {
  const AyahData({
    required this.number,
    required this.surah,
    required this.ayah,
    required this.arabic,
    required this.english,
    required this.urdu,
    required this.transliteration,
  });

  final int number;
  final int surah;
  final int ayah;
  final String arabic;
  final String english;
  final String urdu;
  final String transliteration;
}

class SurahData {
  const SurahData({
    required this.number,
    required this.name,
    required this.englishName,
    required this.ayahs,
  });

  final int number;
  final String name;
  final String englishName;
  final List<AyahData> ayahs;
}

/// Local Quran repository.
///
/// All four datasets are bundled into the Flutter build. No HTTP request is
/// made when reading the Quran, opening a Surah, showing the daily ayah, or
/// building the Mutashabihat corpus. The build script verifies 114 Surahs and
/// 6,236 ayahs in every source before the assets are accepted.
class QuranService {
  static final Map<int, SurahData> _surahCache = {};
  static Future<void>? _loadFuture;
  static List<AyahData>? _allAyahs;

  static Future<void> _ensureLoaded() {
    return _loadFuture ??= _loadLocalDatasets();
  }

  static Future<void> _loadLocalDatasets() async {
    final arabic = await _readList('assets/quran/quran.json');
    final english = await _readList('assets/quran/quran_en.json');
    final urdu = await _readList('assets/quran/quran_ur.json');
    final transliteration = await _readList('assets/quran/quran_transliteration.json');

    if (arabic.length != 114 || english.length != 114 || urdu.length != 114 || transliteration.length != 114) {
      throw StateError('Bundled Quran data is incomplete: expected 114 Surahs in every dataset.');
    }

    final all = <AyahData>[];
    for (var s = 0; s < 114; s++) {
      final aChapter = arabic[s] as Map<String, dynamic>;
      final eChapter = english[s] as Map<String, dynamic>;
      final uChapter = urdu[s] as Map<String, dynamic>;
      final tChapter = transliteration[s] as Map<String, dynamic>;
      final aVerses = (aChapter['verses'] as List).cast<Map<String, dynamic>>();
      final eVerses = (eChapter['verses'] as List).cast<Map<String, dynamic>>();
      final uVerses = (uChapter['verses'] as List).cast<Map<String, dynamic>>();
      final tVerses = (tChapter['verses'] as List).cast<Map<String, dynamic>>();
      if (aVerses.length != eVerses.length || aVerses.length != uVerses.length || aVerses.length != tVerses.length) {
        throw StateError('Bundled Quran dataset mismatch in Surah ${s + 1}.');
      }

      final surahNumber = (aChapter['id'] as num).toInt();
      for (var i = 0; i < aVerses.length; i++) {
        final verse = aVerses[i];
        final e = eVerses[i];
        final u = uVerses[i];
        final t = tVerses[i];
        final ayahNumber = (verse['id'] as num).toInt();
        all.add(AyahData(
          number: all.length + 1,
          surah: surahNumber,
          ayah: ayahNumber,
          arabic: verse['text'] as String,
          english: _translationText(e),
          urdu: _translationText(u),
          transliteration: _translationText(t),
        ));
      }
    }

    if (all.length != 6236) {
      throw StateError('Bundled Quran data is incomplete: expected 6,236 ayahs, got ${all.length}.');
    }
    _allAyahs = all;
  }

  static Future<List<dynamic>> _readList(String path) async {
    final raw = await rootBundle.loadString(path);
    final decoded = jsonDecode(raw);
    if (decoded is! List) throw StateError('Invalid Quran asset: $path');
    return decoded;
  }

  static String _translationText(Map<String, dynamic> verse) {
    final value = verse['translation'] ?? verse['text'];
    if (value is! String) throw StateError('Invalid translation verse payload.');
    return value;
  }

  static Future<SurahData> loadSurah(int number) async {
    if (number < 1 || number > 114) throw ArgumentError.value(number, 'number');
    await _ensureLoaded();
    final cached = _surahCache[number];
    if (cached != null) return cached;

    final all = _allAyahs!;
    final ayahs = all.where((a) => a.surah == number).toList(growable: false);
    if (ayahs.isEmpty) throw StateError('Surah $number was not found in the bundled Quran.');

    final raw = await _readList('assets/quran/quran.json');
    final chapter = raw.firstWhere((item) => (item as Map<String, dynamic>)['id'] == number) as Map<String, dynamic>;
    final result = SurahData(
      number: number,
      name: chapter['name'] as String,
      englishName: chapter['transliteration'] as String,
      ayahs: ayahs,
    );
    _surahCache[number] = result;
    return result;
  }

  static Future<AyahData> loadAyah(int globalNumber) async {
    await _ensureLoaded();
    if (globalNumber < 1 || globalNumber > _allAyahs!.length) {
      throw ArgumentError.value(globalNumber, 'globalNumber');
    }
    return _allAyahs![globalNumber - 1];
  }

  static Future<List<AyahData>> loadAllAyahs() async {
    await _ensureLoaded();
    return List.unmodifiable(_allAyahs!);
  }
}
