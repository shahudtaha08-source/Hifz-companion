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
  List<AyahData> _sourceAyahs = [];
  List<AyahData> _roundAyahs = [];
  int _repeat = 1;
  int _round = 1;
  int _selectedStart = 0;
  Reciter _reciter = reciters.first;
  bool _arabicThenUrdu = false;
  VoidCallback? onSequenceComplete;

  QuranAudioController() {
    _indexSub = _player.currentIndexStream.listen((index) {
      if (index == null || index >= _sourceAyahs.length) return;
      currentAyah.value = _sourceAyahs[index];
      final segmentsPerRound = _roundAyahs.length * ((_arabicThenUrdu && !_reciter.urdu) ? 2 : 1);
      _round = segmentsPerRound == 0 ? 1 : (index ~/ segmentsPerRound) + 1;
      notifyListeners();
    });
    _stateSub = _player.playerStateStream.listen((state) {
      if (state.processingState == ProcessingState.completed) onSequenceComplete?.call();
      notifyListeners();
    });
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

  Future<void> playAyahs(List<AyahData> ayahs, {int start = 0}) async {
    if (ayahs.isEmpty) return;
    final safeStart = start.clamp(0, ayahs.length - 1);
    _selectedStart = safeStart;
    _roundAyahs = ayahs.sublist(safeStart);
    _round = 1;
    final selected = _reciter;
    final urdu = reciters.firstWhere((r) => r.urdu);
    final sources = <AudioSource>[];
    _sourceAyahs = [];

    for (var r = 0; r < _repeat; r++) {
      for (final ayah in _roundAyahs) {
        sources.add(AudioSource.uri(Uri.parse(selected.urlFor(ayah)), tag: ayah));
        _sourceAyahs.add(ayah);
        if (_arabicThenUrdu && !selected.urdu) {
          sources.add(AudioSource.uri(Uri.parse(urdu.urlFor(ayah)), tag: ayah));
          _sourceAyahs.add(ayah);
        }
      }
    }

    await _player.stop();
    // just_audio 0.9.46 exposes setAudioSource; use a ConcatenatingAudioSource
    // for queue playback so the project builds against the resolved dependency.
    final playlist = ConcatenatingAudioSource(children: sources);
    await _player.setAudioSource(playlist, initialIndex: 0, initialPosition: Duration.zero);
    currentAyah.value = _roundAyahs.first;
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
