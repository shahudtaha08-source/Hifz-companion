import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';

import 'quran_service.dart';

class Reciter {
  const Reciter({
    required this.id,
    required this.name,
    required this.edition,
    this.everyAyahFolder,
    this.alternateEveryAyahFolders = const [],
    this.urdu = false,
    this.preferEveryAyah = false,
  });

  final String id;
  final String name;
  final String edition;
  final String? everyAyahFolder;
  final List<String> alternateEveryAyahFolders;
  final bool urdu;
  final bool preferEveryAyah;

  String cdnUrlFor(AyahData ayah) =>
      'https://cdn.islamic.network/quran/audio/128/$edition/${ayah.number}.mp3';

  List<String> everyAyahUrlsFor(AyahData ayah) {
    final folders = <String>[
      if (everyAyahFolder != null) everyAyahFolder!,
      ...alternateEveryAyahFolders,
    ];
    final s = ayah.surah.toString().padLeft(3, '0');
    final a = ayah.ayah.toString().padLeft(3, '0');
    return folders
        .map((folder) => 'https://everyayah.com/data/$folder/$s$a.mp3')
        .toSet()
        .toList();
  }
}

const reciters = <Reciter>[
  Reciter(id: 'alafasy', name: 'Mishary Rashid Alafasy', edition: 'ar.alafasy', everyAyahFolder: 'Alafasy_128kbps'),
  Reciter(id: 'sudais', name: 'Abdur-Rahman As-Sudais', edition: 'ar.abdurrahmaansudais', everyAyahFolder: 'Abdurrahmaan_As-Sudais_192kbps'),
  Reciter(id: 'shuraim', name: 'Saud Ash-Shuraim', edition: 'ar.saoodshuraym', everyAyahFolder: 'Saood_ash-Shuraym_128kbps'),
  Reciter(id: 'maher', name: 'Maher Al-Muaiqly', edition: 'ar.mahermuaiqly', everyAyahFolder: 'MaherAlMuaiqly128kbps'),
  Reciter(id: 'husary', name: 'Mahmoud Khalil Al-Husary', edition: 'ar.husary', everyAyahFolder: 'Husary_128kbps'),
  Reciter(id: 'minshawi', name: 'Mohamed Siddiq Al-Minshawi', edition: 'ar.minshawi', everyAyahFolder: 'Minshawy_Murattal_128kbps'),
  Reciter(id: 'abdulbasit', name: 'Abdul Basit Abdus Samad', edition: 'ar.abdulbasitmurattal', everyAyahFolder: 'Abdul_Basit_Murattal_192kbps'),
  Reciter(id: 'ghamdi', name: 'Saad Al-Ghamdi', edition: 'ar.saadalghamdi', everyAyahFolder: 'Ghamadi_40kbps'),
  Reciter(id: 'ajmy', name: 'Ahmed Al-Ajmi', edition: 'ar.ahmedajamy', everyAyahFolder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net'),
  Reciter(id: 'shamshad', name: 'Shamshad Ali Khan (Urdu)', edition: 'ur.jalandhry', everyAyahFolder: 'translations/urdu_shamshad_ali_khan_46kbps', urdu: true, preferEveryAyah: true),
  Reciter(
    id: 'fateh-jalandhari',
    name: 'Fateh Muhammad Jalandhari (Urdu)',
    edition: 'ur.jalandhry',
    everyAyahFolder: 'translations/urdu_fateh_muhammad_jalandhri_46kbps',
    alternateEveryAyahFolders: [
      'translations/urdu_fateh_muhammad_jalandhari_46kbps',
      'translations/urdu_fateh_muhammad_jalandhry_46kbps',
    ],
    urdu: true,
    preferEveryAyah: true,
  ),
];

class _QueueItem {
  const _QueueItem(this.ayah, this.reciter);
  final AyahData ayah;
  final Reciter reciter;
}

class QuranAudioController extends ChangeNotifier {
  QuranAudioController() {
    _stateSub = _player.playerStateStream.listen((state) {
      if (state.processingState == ProcessingState.completed) {
        _advance();
      }
      notifyListeners();
    });
  }

  final AudioPlayer _player = AudioPlayer();
  StreamSubscription<PlayerState>? _stateSub;
  final ValueNotifier<AyahData?> currentAyah = ValueNotifier(null);

  List<_QueueItem> _queue = [];
  int _queueIndex = -1;
  int _repeat = 1;
  int _round = 1;
  Reciter _reciter = reciters.first;
  bool _arabicThenUrdu = false;
  bool _loading = false;
  bool _stopped = true;
  String? _errorMessage;
  bool _advancing = false;
  VoidCallback? onSequenceComplete;

  Reciter get reciter => _reciter;
  bool get isPlaying => _player.playing;
  bool get isPaused => !_player.playing && _queueIndex >= 0 && !_stopped;
  bool get isLoading => _loading;
  bool get hasActiveQueue => _queue.isNotEmpty && _queueIndex >= 0 && !_stopped;
  bool get arabicThenUrdu => _arabicThenUrdu;
  int get repeat => _repeat;
  int get round => _round;
  String? get errorMessage => _errorMessage;

  void setReciter(Reciter value) {
    _reciter = value;
    _errorMessage = null;
    notifyListeners();
  }

  void setRepeat(int value) {
    _repeat = value.clamp(1, 51).toInt();
    notifyListeners();
  }

  void setArabicThenUrdu(bool value) {
    _arabicThenUrdu = value;
    notifyListeners();
  }

  Future<void> playAyahs(List<AyahData> ayahs, {int start = 0}) async {
    if (ayahs.isEmpty || start < 0 || start >= ayahs.length) return;

    await _player.stop();
    _queue = [];
    _queueIndex = -1;
    _round = 1;
    _errorMessage = null;
    _stopped = false;

    final selected = _reciter;
    final urdu = reciters.firstWhere((r) => r.urdu);
    final selectedAyahs = ayahs.sublist(start);

    for (var round = 0; round < _repeat; round++) {
      for (final ayah in selectedAyahs) {
        _queue.add(_QueueItem(ayah, selected));
        if (_arabicThenUrdu && !selected.urdu) {
          _queue.add(_QueueItem(ayah, urdu));
        }
      }
    }

    await _playIndex(0);
  }

  Future<void> playSingle(AyahData ayah) => playAyahs([ayah]);

  Future<void> pause() async {
    if (_stopped || _loading) return;
    await _player.pause();
    notifyListeners();
  }

  Future<void> resume() async {
    if (_loading) return;
    if (_stopped || _queueIndex < 0) return;
    _errorMessage = null;
    await _player.play();
    notifyListeners();
  }

  Future<void> stop() async {
    _stopped = true;
    _loading = false;
    _queueIndex = -1;
    _queue = [];
    _round = 1;
    _errorMessage = null;
    currentAyah.value = null;
    await _player.stop();
    notifyListeners();
  }

  Future<void> _advance() async {
    if (_advancing || _stopped || _queueIndex < 0) return;
    _advancing = true;
    try {
      final next = _queueIndex + 1;
      if (next >= _queue.length) {
        _stopped = true;
        _queueIndex = -1;
        currentAyah.value = null;
        notifyListeners();
        onSequenceComplete?.call();
        return;
      }
      await _playIndex(next);
    } finally {
      _advancing = false;
    }
  }

  Future<void> _playIndex(int index) async {
    if (_stopped || index < 0 || index >= _queue.length) return;
    _loading = true;
    _errorMessage = null;
    _queueIndex = index;
    final item = _queue[index];
    currentAyah.value = item.ayah;

    final everyAyahSources = item.reciter.everyAyahUrlsFor(item.ayah);
    final sources = item.reciter.preferEveryAyah
        ? <String>[...everyAyahSources, item.reciter.cdnUrlFor(item.ayah)]
        : <String>[item.reciter.cdnUrlFor(item.ayah), ...everyAyahSources];

    Object? lastError;
    try {
      for (final source in sources.toSet()) {
        try {
          await _player.stop();
          await _player.setUrl(source);
          if (_stopped || _queueIndex != index) return;
          _loading = false;
          _round = _roundFor(index);
          notifyListeners();
          await _player.play();
          return;
        } catch (error) {
          lastError = error;
        }
      }
      _loading = false;
      _errorMessage = 'Audio for ${item.ayah.surah}:${item.ayah.ayah} could not be loaded from any available source.';
      notifyListeners();
      await _advance();
    } finally {
      if (_loading) {
        _loading = false;
        if (lastError != null && _errorMessage == null) {
          _errorMessage = 'Audio playback failed: $lastError';
        }
        notifyListeners();
      }
    }
  }

  int _roundFor(int index) {
    final perRound = _queue.isEmpty ? 1 : _queue.length ~/ _repeat;
    return perRound == 0 ? 1 : (index ~/ perRound) + 1;
  }

  @override
  void dispose() {
    _stateSub?.cancel();
    currentAyah.dispose();
    _player.dispose();
    super.dispose();
  }
}
