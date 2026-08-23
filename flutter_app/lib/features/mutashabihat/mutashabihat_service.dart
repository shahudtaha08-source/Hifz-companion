import 'dart:math';

import '../quran/quran_service.dart';

class MutashabihatMatch {
  const MutashabihatMatch({
    required this.source,
    required this.target,
    required this.score,
    required this.shared,
  });

  final AyahData source;
  final AyahData target;
  final int score;
  final String shared;
}

/// Quran-wide Mutashabihat engine.
///
/// It indexes all 6,236 ayahs, normalizes Arabic orthography and builds an
/// inverted n-gram index. This avoids a manually curated, selective list.
class MutashabihatService {
  static List<AyahData>? _corpus;
  static final Map<String, List<int>> _index = {};

  static int get loadedCount => _corpus?.length ?? 0;
  static bool get isReady => _corpus?.length == 6236;

  static Future<void> ensureIndexed({void Function(int loaded, int total)? onProgress}) async {
    if (isReady) return;
    final all = <AyahData>[];
    const total = 114;
    var next = 1;

    Future<void> worker() async {
      while (true) {
        final surahNumber = next++;
        if (surahNumber > total) return;
        final surah = await QuranService.loadSurah(surahNumber);
        all.addAll(surah.ayahs);
        onProgress?.call(all.length, 6236);
      }
    }

    // Keep requests bounded so public Quran endpoints are not hammered.
    await Future.wait(List.generate(6, (_) => worker()));
    all.sort((a, b) => a.number.compareTo(b.number));
    _corpus = all;
    _buildIndex(all);
  }

  static void _buildIndex(List<AyahData> all) {
    _index.clear();
    for (var i = 0; i < all.length; i++) {
      final words = _words(all[i].arabic);
      final grams = <String>{};
      for (var n = 3; n <= min(6, words.length); n++) {
        for (var j = 0; j <= words.length - n; j++) {
          grams.add(words.sublist(j, j + n).join(' '));
        }
      }
      for (final gram in grams) {
        _index.putIfAbsent(gram, () => <int>[]).add(i);
      }
    }
  }

  static List<MutashabihatMatch> findForAyah(AyahData source, {int limit = 30}) {
    final all = _corpus;
    if (all == null) return const [];
    final sourceWords = _words(source.arabic);
    final candidateIndexes = <int>{};
    final grams = <String>{};
    for (var n = 3; n <= min(6, sourceWords.length); n++) {
      for (var i = 0; i <= sourceWords.length - n; i++) {
        grams.add(sourceWords.sublist(i, i + n).join(' '));
      }
    }
    for (final gram in grams) {
      candidateIndexes.addAll(_index[gram] ?? const []);
    }

    final matches = <MutashabihatMatch>[];
    for (final i in candidateIndexes) {
      final target = all[i];
      if (target.number == source.number) continue;
      final result = _compare(sourceWords, _words(target.arabic));
      if (result.$1 < 35 || result.$2.split(' ').length < 3) continue;
      matches.add(MutashabihatMatch(source: source, target: target, score: result.$1, shared: result.$2));
    }
    matches.sort((a, b) => b.score.compareTo(a.score));
    return matches.take(limit).toList();
  }

  static (int, String) _compare(List<String> a, List<String> b) {
    final positions = <String, int>{};
    for (var i = 0; i < b.length; i++) positions.putIfAbsent(b[i], () => i);
    var bestLength = 0;
    var bestPhrase = '';
    for (var i = 0; i < a.length; i++) {
      final j = positions[a[i]];
      if (j == null) continue;
      var x = i;
      var y = j;
      var length = 0;
      while (x < a.length && y < b.length && a[x] == b[y]) {
        length++;
        x++;
        y++;
      }
      if (length > bestLength) {
        bestLength = length;
        bestPhrase = a.sublist(i, i + length).join(' ');
      }
    }
    final denominator = max(1, min(a.length, b.length));
    return ((bestLength * 100 / denominator).round(), bestPhrase);
  }

  static List<String> _words(String text) => _normalize(text)
      .split(RegExp(r'\s+'))
      .where((word) => word.isNotEmpty)
      .toList();

  static String _normalize(String text) => text
      .replaceAll(RegExp(r'[\u064B-\u065F\u0670\u06D6-\u06ED]'), '')
      .replaceAll('ٱ', 'ا')
      .replaceAll('أ', 'ا')
      .replaceAll('إ', 'ا')
      .replaceAll('آ', 'ا')
      .replaceAll('ى', 'ي')
      .replaceAll('ة', 'ه')
      .replaceAll(RegExp(r'[^\u0621-\u063A\u0641-\u064A\s]'), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}
