import 'dart:convert';

import 'package:http/http.dart' as http;

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

class QuranService {
  static const _host = 'https://api.alquran.cloud/v1';
  static final Map<int, SurahData> _surahCache = {};

  // Uses package:http instead of dart:io HttpClient so the same code works on
  // Flutter Web, Android, iOS and desktop.
  static Future<dynamic> _get(String path) async {
    final response = await http.get(Uri.parse('$_host$path'));
    if (response.statusCode != 200) {
      throw Exception('Quran data request failed: ${response.statusCode}');
    }

    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    if (decoded['code'] != 200) {
      throw Exception('Quran data is unavailable');
    }
    return decoded['data'];
  }

  static Future<SurahData> loadSurah(int number) async {
    final cached = _surahCache[number];
    if (cached != null) return cached;

    final raw = await _get(
      '/surah/$number/editions/quran-uthmani,en.sahih,ur.jalandhry,en.transliteration',
    ) as List<dynamic>;
    final editions = raw.cast<Map<String, dynamic>>();
    final arabic = editions[0];
    final english = editions[1];
    final urdu = editions[2];
    final transliteration = editions[3];

    final arabicAyahs = (arabic['ayahs'] as List).cast<Map<String, dynamic>>();
    final englishAyahs = (english['ayahs'] as List).cast<Map<String, dynamic>>();
    final urduAyahs = (urdu['ayahs'] as List).cast<Map<String, dynamic>>();
    final translitAyahs = (transliteration['ayahs'] as List).cast<Map<String, dynamic>>();

    final ayahs = List.generate(arabicAyahs.length, (i) {
      final a = arabicAyahs[i];
      return AyahData(
        number: a['number'] as int,
        surah: number,
        ayah: a['numberInSurah'] as int,
        arabic: a['text'] as String,
        english: englishAyahs[i]['text'] as String,
        urdu: urduAyahs[i]['text'] as String,
        transliteration: translitAyahs[i]['text'] as String,
      );
    });

    final result = SurahData(
      number: number,
      name: arabic['name'] as String,
      englishName: arabic['englishName'] as String,
      ayahs: ayahs,
    );
    _surahCache[number] = result;
    return result;
  }

  static Future<AyahData> loadAyah(int globalNumber) async {
    final raw = await _get(
      '/ayah/$globalNumber/editions/quran-uthmani,en.sahih,ur.jalandhry,en.transliteration',
    ) as List<dynamic>;
    final editions = raw.cast<Map<String, dynamic>>();
    final a = editions[0] as Map<String, dynamic>;

    return AyahData(
      number: a['number'] as int,
      surah: (a['surah'] as Map<String, dynamic>)['number'] as int,
      ayah: a['numberInSurah'] as int,
      arabic: a['text'] as String,
      english: (editions[1] as Map<String, dynamic>)['text'] as String,
      urdu: (editions[2] as Map<String, dynamic>)['text'] as String,
      transliteration: (editions[3] as Map<String, dynamic>)['text'] as String,
    );
  }
}
