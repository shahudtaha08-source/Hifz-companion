import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';

import 'quran_service.dart';

class Reciter {
  const Reciter({required this.id, required this.name, required this.folder, this.urdu = false});
  final String id;
  final String name;
  final String folder;
  final bool urdu;

  String urlFor(AyahData ayah) {
    final s = ayah.surah.toString().padLeft(3, '0');
    final a = ayah.ayah.toString().padLeft(3, '0');
    return 'https://everyayah.com/data/$folder/$s$a.mp3';
  }
}

const reciters = <Reciter>[
  Reciter(id: 'alafasy', name: 'Mishary Rashid Alafasy', folder: 'Alafasy_128kbps'),
  Reciter(id: 'sudais', name: 'Abdur-Rahman As-Sudais', folder: 'Abdurrahmaan_As-Sudais_192kbps'),
  Reciter(id: 'shuraim', name: 'Saud Ash-Shuraim', folder: 'Saood_ash-Shuraym_128kbps'),
  Reciter(id: 'maher', name: 'Maher Al-Muaiqly', folder: 'MaherAlMuaiqly128kbps'),
  Reciter(id: 'husary', name: 'Mahmoud Khalil Al-Husary', folder: 'Husary_128kbps'),
  Reciter(id: 'minshawi', name: 'Mohamed Siddiq Al-Minshawi', folder: 'Minshawy_Murattal_128kbps'),
  Reciter(id: 'abdulbasit', name: 'Abdul Basit Abdus Samad', folder: 'Abdul_Basit_Murattal_192kbps'),
  Reciter(id: 'ghamdi', name: 'Saad Al-Ghamdi', folder: 'Ghamadi_40kbps'),
  Reciter(id: 'ajmy', name: 'Ahmed Al-Ajmi', folder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net'),
  Reciter(id: 'shamshad', name: 'Shamshad Ali Khan (Urdu)', folder: 'translations/urdu_shamshad_ali_khan_46kbps', urdu: true),
];

class QuranAudioController extends ChangeNotifier {
  final AudioPlayer _player = AudioPlayer();
  StreamSubscription<int?>? _indexSub;
  StreamSubscription<PlayerState>? _stateSub;
  List<AyahData> _queue = [];
  int _repeat = 1;
  int _round = 1;
  Reciter _reciter = reciters.first;
  bool _arabicThenUrdu = false;

  QuranAudioController() {
    _indexSub = _player.currentIndexStream.listen((index) {
      if (index == null || _queue.isEmpty) return;
      currentAyah.value = _queue[index % _queue.length];
      _round = (index ~/ _queue.length) + 1;
      notifyListeners();
    });
    _stateSub = _player.playerStateStream.listen((_) => notifyListeners());
  }

  final ValueNotifier<AyahData?> currentAyah = ValueNotifier(null);
  Reciter get reciter => _reciter;
  bool get isPlaying => _player.playing;
  bool get arabicThenUrdu => _arabicThenUrdu;
  int get repeat => _repeat;
  int get round => _round;

  void setReciter(Reciter value) {
    _reciter = value;
    notifyListeners();
  }

  void setRepeat(int value) {
    _repeat = value.clamp(1, 51);
    notifyListeners();
  }

  void setArabicThenUrdu(bool value) {
    _arabicThenUrdu = value;
    notifyListeners();
  }

  Future<void> playAyahs(List<AyahData> ayahs, {int start = 0, bool nextSurah = false}) async {
    if (ayahs.isEmpty) return;
    _queue = ayahs;
    _round = 1;
    final selected = _reciter;
    final urdu = reciters.firstWhere((r) => r.urdu);
    final sources = <AudioSource>[];
    final repeated = <AyahData>[];
    for (var r = 0; r < _repeat; r++) {
      repeated.addAll(ayahs.sublist(start));
    }
    for (final ayah in repeated) {
      sources.add(AudioSource.uri(Uri.parse(selected.urlFor(ayah)), tag: ayah));
      if (_arabicThenUrdu && !selected.urdu) {
        sources.add(AudioSource.uri(Uri.parse(urdu.urlFor(ayah)), tag: ayah));
      }
    }
    await _player.stop();
    await _player.setAudioSources(sources, initialIndex: 0, initialPosition: Duration.zero);
    currentAyah.value = ayahs[start];
    await _player.play();
  }

  Future<void> playSingle(AyahData ayah) => playAyahs([ayah]);
  Future<void> pause() => _player.pause();
  Future<void> resume() => _player.play();
  Future<void> stop() => _player.stop();

  @override
  void dispose() {
    _indexSub?.cancel();
    _stateSub?.cancel();
    currentAyah.dispose();
    _player.dispose();
    super.dispose();
  }
}
