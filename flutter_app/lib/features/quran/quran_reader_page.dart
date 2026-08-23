import 'package:flutter/material.dart';

import 'quran_audio_controller.dart';
import 'quran_service.dart';

const _surahNames = <String>[
  'Al-Fatihah','Al-Baqarah','Ali Imran','An-Nisa','Al-Ma\'idah','Al-An\'am','Al-A\'raf','Al-Anfal','At-Tawbah','Yunus','Hud','Yusuf','Ar-Ra\'d','Ibrahim','Al-Hijr','An-Nahl','Al-Isra','Al-Kahf','Maryam','Ta-Ha','Al-Anbiya','Al-Hajj','Al-Mu\'minun','An-Nur','Al-Furqan','Ash-Shu\'ara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum','Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir','Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf','Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman','Al-Waqi\'ah','Al-Hadid','Al-Mujadila','Al-Hashr','Al-Mumtahanah','As-Saff','Al-Jumu\'ah','Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Ma\'arij','Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba','An-Nazi\'at','Abasa','At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj','At-Tariq','Al-A\'la','Al-Ghashiyah','Al-Fajr','Al-Balad','Ash-Shams','Al-Layl','Ad-Duha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat','Al-Qari\'ah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil','Quraysh','Al-Ma\'un','Al-Kawthar','Al-Kafirun','An-Nasr','Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas'
];

class QuranReaderPage extends StatefulWidget {
  const QuranReaderPage({super.key});

  @override
  State<QuranReaderPage> createState() => _QuranReaderPageState();
}

class _QuranReaderPageState extends State<QuranReaderPage> {
  final QuranAudioController _audio = QuranAudioController();
  int _surahNumber = 1;
  Future<SurahData>? _surah;
  bool _autoNextSurah = true;
  bool _showEnglish = true;
  bool _showUrdu = true;
  bool _showTransliteration = true;

  @override
  void initState() {
    super.initState();
    _surah = QuranService.loadSurah(_surahNumber);
    _audio.onSequenceComplete = _playNextSurah;
  }

  Future<void> _changeSurah(int number) async {
    await _audio.stop();
    if (!mounted) return;
    setState(() {
      _surahNumber = number;
      _surah = QuranService.loadSurah(number);
    });
  }

  Future<void> _playNextSurah() async {
    if (!_autoNextSurah || _surahNumber >= 114 || !mounted) return;
    final next = _surahNumber + 1;
    final data = await QuranService.loadSurah(next);
    if (!mounted) return;
    setState(() {
      _surahNumber = next;
      _surah = Future.value(data);
    });
    await _audio.playAyahs(data.ayahs);
  }

  @override
  void dispose() {
    _audio.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return AnimatedBuilder(
      animation: _audio,
      builder: (context, _) => LayoutBuilder(
        builder: (context, constraints) => FutureBuilder<SurahData>(
          future: _surah,
          builder: (context, snapshot) {
            final data = snapshot.data;
            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(constraints.maxWidth > 760 ? 36 : 16, 22, constraints.maxWidth > 760 ? 36 : 16, 32),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 980),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Quran Reader', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 6),
                      Text('Read, listen, repeat and follow each ayah with Arabic, translations and transliteration.', style: theme.textTheme.bodyMedium),
                      const SizedBox(height: 20),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              DropdownButtonFormField<int>(
                                value: _surahNumber,
                                isExpanded: true,
                                decoration: const InputDecoration(labelText: 'Surah'),
                                items: List.generate(114, (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1}. ${_surahNames[i]}'))),
                                onChanged: (v) { if (v != null) _changeSurah(v); },
                              ),
                              const SizedBox(height: 12),
                              DropdownButtonFormField<Reciter>(
                                value: _audio.reciter,
                                isExpanded: true,
                                decoration: const InputDecoration(labelText: 'Reciter'),
                                items: reciters.map((r) => DropdownMenuItem(value: r, child: Text(r.name))).toList(),
                                onChanged: (v) { if (v != null) _audio.setReciter(v); },
                              ),
                              const SizedBox(height: 8),
                              SwitchListTile(
                                contentPadding: EdgeInsets.zero,
                                title: const Text('Arabic then Urdu for each ayah'),
                                subtitle: const Text('Selected reciter first, then the Urdu audio translation.'),
                                value: _audio.arabicThenUrdu,
                                onChanged: _audio.reciter.urdu ? null : _audio.setArabicThenUrdu,
                              ),
                              SwitchListTile(
                                contentPadding: EdgeInsets.zero,
                                title: const Text('Continue to next Surah'),
                                subtitle: const Text('Start the next Surah automatically after this sequence finishes.'),
                                value: _autoNextSurah,
                                onChanged: (v) => setState(() => _autoNextSurah = v),
                              ),
                              const SizedBox(height: 4),
                              Text('Repetitions', style: theme.textTheme.labelLarge),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [1, 2, 3, 5, 7, 11, 21, 31, 51].map((n) => ChoiceChip(
                                  label: Text('×$n'),
                                  selected: _audio.repeat == n,
                                  onSelected: (_) => _audio.setRepeat(n),
                                )).toList(),
                              ),
                              const SizedBox(height: 18),
                              if (data != null)
                                Wrap(
                                  spacing: 10,
                                  runSpacing: 10,
                                  children: [
                                    FilledButton.icon(
                                      onPressed: _audio.isLoading ? null : () async => _audio.playAyahs(data.ayahs),
                                      icon: _audio.isLoading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.play_arrow_rounded),
                                      label: Text(_audio.isLoading ? 'Loading audio…' : 'Play Surah'),
                                    ),
                                    OutlinedButton.icon(
                                      onPressed: _audio.hasActiveQueue && !_audio.isLoading ? () async => _audio.pause() : null,
                                      icon: const Icon(Icons.pause_rounded),
                                      label: const Text('Pause'),
                                    ),
                                    OutlinedButton.icon(
                                      onPressed: _audio.isPaused && !_audio.isLoading ? () async => _audio.resume() : null,
                                      icon: const Icon(Icons.play_arrow_rounded),
                                      label: const Text('Resume'),
                                    ),
                                    OutlinedButton.icon(
                                      onPressed: _audio.hasActiveQueue || _audio.isLoading ? () async => _audio.stop() : null,
                                      icon: const Icon(Icons.stop_rounded),
                                      label: const Text('Stop'),
                                    ),
                                  ],
                                ),
                              if (_audio.currentAyah.value != null) ...[
                                const SizedBox(height: 14),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(color: scheme.primaryContainer, borderRadius: BorderRadius.circular(12)),
                                  child: Row(children: [
                                    Icon(_audio.isPlaying ? Icons.volume_up_rounded : Icons.pause_circle_outline_rounded, color: scheme.onPrimaryContainer),
                                    const SizedBox(width: 10),
                                    Expanded(child: Text('Ayah ${_audio.currentAyah.value!.surah}:${_audio.currentAyah.value!.ayah} • Round ${_audio.round}/${_audio.repeat}', style: TextStyle(fontWeight: FontWeight.w700, color: scheme.onPrimaryContainer))),
                                  ]),
                                ),
                              ],
                              if (_audio.errorMessage != null) ...[
                                const SizedBox(height: 12),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(color: scheme.errorContainer, borderRadius: BorderRadius.circular(12)),
                                  child: Text(_audio.errorMessage!, style: TextStyle(color: scheme.onErrorContainer)),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (snapshot.connectionState == ConnectionState.waiting)
                        const Center(child: Padding(padding: EdgeInsets.all(48), child: CircularProgressIndicator()))
                      else if (snapshot.hasError)
                        Card(child: Padding(padding: const EdgeInsets.all(20), child: Text('Could not load Quran data right now. Please check the connection and try again.\n${snapshot.error}')))
                      else if (data != null) ...[
                        Row(children: [
                          Expanded(child: Text('${data.number}. ${data.englishName}', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800))),
                          Text(data.name, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                        ]),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            FilterChip(label: const Text('English'), selected: _showEnglish, onSelected: (v) => setState(() => _showEnglish = v)),
                            FilterChip(label: const Text('Urdu'), selected: _showUrdu, onSelected: (v) => setState(() => _showUrdu = v)),
                            FilterChip(label: const Text('Transliteration'), selected: _showTransliteration, onSelected: (v) => setState(() => _showTransliteration = v)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ValueListenableBuilder<AyahData?>(
                          valueListenable: _audio.currentAyah,
                          builder: (context, current, _) => Column(
                            children: data.ayahs.map((ayah) {
                              final active = current?.number == ayah.number;
                              return Card(
                                clipBehavior: Clip.antiAlias,
                                color: active ? scheme.primaryContainer : null,
                                child: InkWell(
                                  onTap: () async => _audio.playSingle(ayah),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.stretch,
                                      children: [
                                        Row(children: [
                                          CircleAvatar(radius: 16, child: Text('${ayah.ayah}')),
                                          const Spacer(),
                                          IconButton(onPressed: () async => _audio.playSingle(ayah), icon: Icon(active && _audio.isPlaying ? Icons.equalizer_rounded : Icons.play_circle_outline_rounded), tooltip: 'Play ayah'),
                                        ]),
                                        const SizedBox(height: 8),
                                        Text(ayah.arabic, textAlign: TextAlign.right, textDirection: TextDirection.rtl, style: const TextStyle(fontSize: 25, height: 1.9)),
                                        if (_showTransliteration) ...[const Divider(height: 26), Text(ayah.transliteration, style: const TextStyle(fontStyle: FontStyle.italic))],
                                        if (_showEnglish) ...[const SizedBox(height: 10), Text(ayah.english)],
                                        if (_showUrdu) ...[const SizedBox(height: 12), Text(ayah.urdu, textDirection: TextDirection.rtl, textAlign: TextAlign.right)],
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
