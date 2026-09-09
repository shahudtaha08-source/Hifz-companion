import 'package:http/http.dart' as http;

import 'audio_pack_storage.dart';

class AudioPackService {
  static Future<String?> localPath(String reciterId, int surah, int ayah) =>
      AudioPackStorage.localPath(reciterId, surah, ayah);

  static Future<bool> isSurahDownloaded(String reciterId, int surah, int ayahCount) async {
    if (ayahCount == 0) return false;
    for (var ayah = 1; ayah <= ayahCount; ayah++) {
      if (!await AudioPackStorage.exists(reciterId, surah, ayah)) return false;
    }
    return true;
  }

  static Future<int> downloadedCount(String reciterId, int surah, int ayahCount) async {
    var count = 0;
    for (var ayah = 1; ayah <= ayahCount; ayah++) {
      if (await AudioPackStorage.exists(reciterId, surah, ayah)) count++;
    }
    return count;
  }

  static Future<void> downloadSurah({
    required String reciterId,
    required int surah,
    required List<List<String>> sourcesByAyah,
    void Function(int completed, int total)? onProgress,
  }) async {
    var completed = 0;
    for (var i = 0; i < sourcesByAyah.length; i++) {
      final ayah = i + 1;
      if (await AudioPackStorage.exists(reciterId, surah, ayah)) {
        completed++;
        onProgress?.call(completed, sourcesByAyah.length);
        continue;
      }

      Object? lastError;
      var saved = false;
      for (final url in sourcesByAyah[i]) {
        try {
          final response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 30));
          if (response.statusCode >= 200 && response.statusCode < 300 && response.bodyBytes.isNotEmpty) {
            await AudioPackStorage.save(reciterId, surah, ayah, response.bodyBytes);
            saved = true;
            break;
          }
          lastError = 'HTTP ${response.statusCode}';
        } catch (error) {
          lastError = error;
        }
      }
      if (!saved) throw StateError('Could not download ayah $ayah of Surah $surah: $lastError');
      completed++;
      onProgress?.call(completed, sourcesByAyah.length);
    }
  }
}
