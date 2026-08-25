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
  });

  final String id;
  final String name;
  final String edition;
  final String? everyAyahFolder;
  final List<String> alternateEveryAyahFolders;
  final bool urdu;

  String cdnUrlFor(AyahData ayah) =>
      'https://cdn.islamic.network/quran/audio/128/$edition/${ayah.number}.mp3';

  List<String> everyAyahUrlsFor(AyahData ayah) {
    final folders = <String>[
      if (everyAyahFolder != null) everyAyahFolder!,
      ...alternateEveryAyahFolders,
    ];
    final s = ayah.surah.toString().padLeft(3, '0');
    final a = ayah.ayah.toString().padLeft(3, '0');
    final file = '$s$a.mp3';
    final urls = <String>[];
    for (final folder in folders) {
      urls.add('https://everyayah.com/data/$folder/$file');
      urls.add('https://www.everyayah.com/data/$folder/$file');
    }
    return urls.toSet().toList();
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
  Reciter(id: 'shamshad', name: 'Shamshad Ali Khan (Urdu)', edition: 'ur.jalandhry', everyAyahFolder: 'translations/urdu_shamshad_ali_khan_46kbps', urdu: true),
  Reciter(
    id: 'fateh-jalandhari',
    name: 'Fateh Muhammad Jalandhari (Urdu)',
    edition: 'ur.jalandhry',
    everyAyahFolder: 'translations/urdu_fateh_muhammad_jalandhri_46kbps',
    alternateEveryAyahFolders: [
      'translations/urdu_fateh_muhammad_jalandhari_46kbps',
      'translations/urdu_fateh_muhammad_jalandhary_46kbps',
      'translations/urdu_fateh_muhammad_jalandhry_46kbps',
    ],
    urdu: true,
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
      if (state.playing && state.processingState == ProcessingState.ready) {
        _loading = false;
        _markProgress();
      }
      if (state.processingState == ProcessingState.completed) {
        _advance();
      }
      notifyListeners();
    });
    _positionSub = _player.positionStream.listen((position) {
      if (position > Duration.zero) _markProgress();
    });
    _errorSub = _player.playbackEventStream.listen(
      (_) {},
      onError: (Object error, StackTrace stackTrace) => _recoverFromSourceFailure(error),
    );
  }

  final AudioPlayer _player = AudioPlayer();
  StreamSubscription<PlayerState>? _stateSub;
  StreamSubscription<Duration>? _positionSub;
  StreamSubscription<PlaybackEvent>? _errorSub;
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
  bool _recovering = false;
  int _playToken = 0;
  List<String> _activeSources = const [];
  int _sourceIndex = -1;
  Timer? _bufferWatchdog;
  DateTime _lastProgressAt = DateTime.now();
  VoidCallback? onSequenceComplete;

  Reciter get reciter => _reciter;
  bool get isPlaying => _player.playing;
  bool get isPaused => !_player.playing && _queueIndex >= 0 && !_stopped && !_loading;
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
    final token = ++_playToken;
    _cancelBufferWatchdog();
    await _player.stop();
    if (token != _playToken) return;
    _queue = [];
    _queueIndex = -1;
    _round = 1;
    _errorMessage = null;
    _stopped = false;

    final selected = _reciter;
    final urdu = reciters.firstWhere((r) => r.id == 'fateh-jalandhari');
    final selectedAyahs = ayahs.sublist(start);
    for (var round = 0; round < _repeat; round++) {
      for (final ayah in selectedAyahs) {
        _queue.add(_QueueItem(ayah, selected));
        if (_arabicThenUrdu && !selected.urdu) _queue.add(_QueueItem(ayah, urdu));
      }
    }
    await _playIndex(0, token: token);
  }

  Future<void> playSingle(AyahData ayah) => playAyahs([ayah]);

  Future<void> pause() async {
    if (_stopped || _loading) return;
    _cancelBufferWatchdog();
    await _player.pause();
    notifyListeners();
  }

  Future<void> resume() async {
    if (_stopped || _queueIndex < 0) return;
    _errorMessage = null;
    _loading = false;
    await _player.play();
    _markProgress();
    _startBufferWatchdog(_playToken, _queueIndex, _sourceIndex);
    notifyListeners();
  }

  Future<void> stop() async {
    ++_playToken;
    _cancelBufferWatchdog();
    _stopped = true;
    _loading = false;
    _queueIndex = -1;
    _queue = [];
    _activeSources = const [];
    _sourceIndex = -1;
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
        _finishSequence();
        return;
      }
      await _playIndex(next, token: _playToken);
    } finally {
      _advancing = false;
    }
  }

  void _finishSequence() {
    _cancelBufferWatchdog();
    _stopped = true;
    _loading = false;
    _queueIndex = -1;
    _activeSources = const [];
    _sourceIndex = -1;
    currentAyah.value = null;
    notifyListeners();
    onSequenceComplete?.call();
  }

  Future<void> _playIndex(int index, {required int token}) async {
    if (_stopped || index < 0 || index >= _queue.length || token != _playToken) return;
    _cancelBufferWatchdog();
    _loading = true;
    _errorMessage = null;
    _queueIndex = index;
    _sourceIndex = -1;
    final item = _queue[index];
    currentAyah.value = item.ayah;

    // Put the Islamic Network CDN first for every reciter, then fall back to
    // both EveryAyah hostnames. This avoids depending on a single host.
    _activeSources = <String>[
      item.reciter.cdnUrlFor(item.ayah),
      ...item.reciter.everyAyahUrlsFor(item.ayah),
    ].toSet().toList();

    await _tryCurrentAyahSource(token, startAt: 0);
  }

  Future<bool> _tryCurrentAyahSource(int token, {required int startAt}) async {
    Object? lastError;
    for (var i = startAt; i < _activeSources.length; i++) {
      if (token != _playToken || _stopped) return false;
      _sourceIndex = i;
      _loading = true;
      _errorMessage = i == startAt ? null : 'Trying another audio source…';
      notifyListeners();
      try {
        await _player.stop();
        if (token != _playToken || _stopped) return false;
        await _player.setUrl(_activeSources[i]).timeout(const Duration(seconds: 15));
        if (token != _playToken || _stopped) return false;
        _round = _roundFor(_queueIndex);
        _loading = false;
        _markProgress();
        notifyListeners();
        await _player.play();
        _startBufferWatchdog(token, _queueIndex, i);
        return true;
      } catch (error) {
        lastError = error;
        debugPrint('Audio source failed: ${_activeSources[i]} :: $error');
      }
    }

    if (token != _playToken || _stopped) return false;
    _loading = false;
    _errorMessage = 'Audio is temporarily unavailable. Retrying the next ayah…';
    notifyListeners();
    if (lastError != null) debugPrint('All audio sources failed: $lastError');
    return false;
  }

  void _recoverFromSourceFailure(Object error) {
    if (_recovering || _stopped || _queueIndex < 0) return;
    final token = _playToken;
    final index = _queueIndex;
    _recovering = true;
    _cancelBufferWatchdog();
    _loading = true;
    _errorMessage = 'Connection interrupted. Switching audio source…';
    notifyListeners();

    Future<void>(() async {
      var played = false;
      try {
        if (token != _playToken || _stopped || index != _queueIndex) return;
        played = await _tryCurrentAyahSource(token, startAt: _sourceIndex + 1);
      } catch (e) {
        debugPrint('Audio recovery failed: $e');
      } finally {
        _recovering = false;
      }

      // IMPORTANT: clear the recovery lock before advancing. The previous
      // implementation called _advance while _recovering was still true,
      // causing the queue to get stuck on one ayah forever.
      if (!played && token == _playToken && !_stopped && index == _queueIndex) {
        await _advance();
      }
    });
  }

  void _markProgress() => _lastProgressAt = DateTime.now();

  void _startBufferWatchdog(int token, int queueIndex, int sourceIndex) {
    _cancelBufferWatchdog();
    _bufferWatchdog = Timer.periodic(const Duration(seconds: 8), (timer) {
      if (token != _playToken || _stopped || queueIndex != _queueIndex || sourceIndex != _sourceIndex) {
        timer.cancel();
        return;
      }
      final state = _player.processingState;
      final stalledFor = DateTime.now().difference(_lastProgressAt);
      final isActuallyStalled =
          state == ProcessingState.buffering || state == ProcessingState.loading ||
          (state == ProcessingState.ready && _player.playing && stalledFor > const Duration(seconds: 18));
      if (isActuallyStalled) {
        timer.cancel();
        _recoverFromSourceFailure(TimeoutException('Audio source stalled'));
      }
    });
  }

  void _cancelBufferWatchdog() {
    _bufferWatchdog?.cancel();
    _bufferWatchdog = null;
  }

  int _roundFor(int index) {
    final perRound = _queue.isEmpty ? 1 : _queue.length ~/ _repeat;
    return perRound == 0 ? 1 : (index ~/ perRound) + 1;
  }

  @override
  void dispose() {
    ++_playToken;
    _cancelBufferWatchdog();
    _stateSub?.cancel();
    _positionSub?.cancel();
    _errorSub?.cancel();
    currentAyah.dispose();
    _player.dispose();
    super.dispose();
  }
}
