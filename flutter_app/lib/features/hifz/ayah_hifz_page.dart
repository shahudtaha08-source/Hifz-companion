import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../quran/quran_service.dart';

class AyahHifzPage extends StatefulWidget {
  const AyahHifzPage({super.key, required this.surahNumber, required this.surahName, this.initialAyah});

  final int surahNumber;
  final String surahName;
  final int? initialAyah;

  @override
  State<AyahHifzPage> createState() => _AyahHifzPageState();
}

class _AyahHifzPageState extends State<AyahHifzPage> {
  static const statuses = <String>['Not started', 'Learning', 'Memorized', 'Needs revision'];
  final Map<int, String> _status = {};
  final Map<int, DateTime> _lastReviewed = {};
  final Map<int, GlobalKey> _ayahKeys = {};
  Future<SurahData>? _surah;
  bool _loaded = false;
  bool _showOnlyRevision = false;

  @override
  void initState() {
    super.initState();
    _surah = QuranService.loadSurah(widget.surahNumber);
    _loadStatuses();
  }

  String _key(int ayah) => 'hifz_ayah_${widget.surahNumber}_$ayah';
  String _historyKey(int ayah) => 'hifz_history_${widget.surahNumber}_$ayah';

  Future<void> _loadStatuses() async {
    final prefs = await SharedPreferences.getInstance();
    final data = await _surah!;
    for (final ayah in data.ayahs) {
      _status[ayah.ayah] = prefs.getString(_key(ayah.ayah)) ?? statuses.first;
      final history = prefs.getString(_historyKey(ayah.ayah));
      if (history != null) {
        try {
          final entries = (jsonDecode(history) as List).cast<Map<String, dynamic>>();
          if (entries.isNotEmpty) {
            final value = DateTime.tryParse(entries.last['at']?.toString() ?? '');
            if (value != null) _lastReviewed[ayah.ayah] = value;
          }
        } catch (_) {
          // Ignore malformed legacy history and keep the current Hifz status.
        }
      }
      _ayahKeys[ayah.ayah] ??= GlobalKey();
    }
    if (!mounted) return;
    setState(() => _loaded = true);
    WidgetsBinding.instance.addPostFrameCallback((_) => _resumeToInitialAyah());
  }

  void _resumeToInitialAyah() {
    final ayah = widget.initialAyah;
    if (ayah == null) return;
    final key = _ayahKeys[ayah];
    final context = key?.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(context, duration: const Duration(milliseconds: 450), curve: Curves.easeOut, alignment: 0.12);
    }
  }

  Future<void> _recordReview(SharedPreferences prefs, int ayah, String value) async {
    final now = DateTime.now();
    final raw = prefs.getString(_historyKey(ayah));
    List<Map<String, dynamic>> entries = [];
    if (raw != null) {
      try {
        entries = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      } catch (_) {}
    }
    entries.add({'status': value, 'at': now.toIso8601String()});
    if (entries.length > 20) entries = entries.sublist(entries.length - 20);
    await prefs.setString(_historyKey(ayah), jsonEncode(entries));
    _lastReviewed[ayah] = now;
  }

  String _aggregateSurahStatus(Iterable<String> values) {
    final list = values.toList();
    if (list.isNotEmpty && list.every((s) => s == 'Memorized')) return 'Memorized';
    if (list.any((s) => s == 'Needs revision')) return 'Needs revision';
    if (list.any((s) => s == 'Learning' || s == 'Memorized')) return 'Learning';
    return 'Not started';
  }

  Future<void> _syncSurahStatus(SharedPreferences prefs) async {
    final data = await _surah!;
    final aggregate = _aggregateSurahStatus(data.ayahs.map((a) => _status[a.ayah] ?? statuses.first));
    await prefs.setString('hifz_surah_${widget.surahNumber}', aggregate);
  }

  Future<void> _setStatus(AyahData ayah, String value) async {
    setState(() => _status[ayah.ayah] = value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key(ayah.ayah), value);
    await _recordReview(prefs, ayah.ayah, value);
    await prefs.setInt('hifz_last_surah', widget.surahNumber);
    await prefs.setInt('hifz_last_ayah', ayah.ayah);
    await _syncSurahStatus(prefs);
    if (mounted) setState(() {});
  }

  Future<void> _markAll(String value) async {
    final prefs = await SharedPreferences.getInstance();
    final data = await _surah!;
    setState(() {
      for (final ayah in data.ayahs) {
        _status[ayah.ayah] = value;
      }
    });
    for (final ayah in data.ayahs) {
      await prefs.setString(_key(ayah.ayah), value);
      await _recordReview(prefs, ayah.ayah, value);
    }
    if (data.ayahs.isNotEmpty) {
      await prefs.setInt('hifz_last_surah', widget.surahNumber);
      await prefs.setInt('hifz_last_ayah', data.ayahs.last.ayah);
    }
    await _syncSurahStatus(prefs);
    if (mounted) setState(() {});
  }

  String _reviewLabel(int ayah) {
    final value = _lastReviewed[ayah];
    if (value == null) return 'Not reviewed yet';
    final local = value.toLocal();
    final date = '${local.day.toString().padLeft(2, '0')}/${local.month.toString().padLeft(2, '0')}/${local.year}';
    return 'Last reviewed $date';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.surahNumber}. ${widget.surahName}'),
        actions: [
          IconButton(
            tooltip: _showOnlyRevision ? 'Show all ayahs' : 'Show revision ayahs',
            onPressed: () => setState(() => _showOnlyRevision = !_showOnlyRevision),
            icon: Icon(_showOnlyRevision ? Icons.filter_alt_rounded : Icons.filter_alt_outlined),
          ),
          PopupMenuButton<String>(
            tooltip: 'Bulk status',
            onSelected: _markAll,
            itemBuilder: (_) => statuses
                .where((s) => s != 'Not started')
                .map((s) => PopupMenuItem(value: s, child: Text('Mark all $s')))
                .toList(),
          ),
        ],
      ),
      body: FutureBuilder<SurahData>(
        future: _surah,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting || !_loaded) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData) {
            return Center(child: Text('Could not load this Surah.\n${snapshot.error ?? ''}'));
          }
          final data = snapshot.data!;
          final visible = data.ayahs.where((a) => !_showOnlyRevision || _status[a.ayah] == 'Needs revision').toList();
          final memorized = data.ayahs.where((a) => _status[a.ayah] == 'Memorized').length;
          final revision = data.ayahs.where((a) => _status[a.ayah] == 'Needs revision').length;
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(children: [
                        Expanded(child: Text('$memorized / ${data.ayahs.length} memorized', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800))),
                        if (revision > 0) Chip(avatar: const Icon(Icons.refresh_rounded, size: 17), label: Text('$revision revision')),
                      ]),
                      const SizedBox(height: 10),
                      LinearProgressIndicator(value: data.ayahs.isEmpty ? 0 : memorized / data.ayahs.length, minHeight: 8),
                      const SizedBox(height: 10),
                      Text(_showOnlyRevision ? 'Showing only ayahs marked Needs revision.' : 'Tap an ayah to update its Hifz status.', style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              ...visible.map((ayah) => _AyahCard(
                    key: _ayahKeys[ayah.ayah],
                    ayah: ayah,
                    status: _status[ayah.ayah] ?? statuses.first,
                    reviewLabel: _reviewLabel(ayah.ayah),
                    onStatus: (value) => _setStatus(ayah, value),
                  )),
              if (visible.isEmpty)
                const Card(child: Padding(padding: EdgeInsets.all(24), child: Center(child: Text('No ayahs need revision right now.')))),
            ],
          );
        },
      ),
    );
  }
}

class _AyahCard extends StatelessWidget {
  const _AyahCard({super.key, required this.ayah, required this.status, required this.reviewLabel, required this.onStatus});

  final AyahData ayah;
  final String status;
  final String reviewLabel;
  final ValueChanged<String> onStatus;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(children: [
              CircleAvatar(radius: 15, child: Text('${ayah.ayah}')),
              const Spacer(),
              DropdownButton<String>(
                value: status,
                underline: const SizedBox.shrink(),
                items: _AyahHifzPageState.statuses.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (value) { if (value != null) onStatus(value); },
              ),
            ]),
            Text(reviewLabel, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 8),
            Text(ayah.arabic, textDirection: TextDirection.rtl, textAlign: TextAlign.right, style: TextStyle(fontSize: 25, height: 1.85, color: scheme.onSurface)),
            const SizedBox(height: 8),
            Text(ayah.transliteration, style: const TextStyle(fontStyle: FontStyle.italic)),
            const SizedBox(height: 8),
            Text(ayah.english),
            const SizedBox(height: 8),
            Text(ayah.urdu, textDirection: TextDirection.rtl, textAlign: TextAlign.right),
          ],
        ),
      ),
    );
  }
}
