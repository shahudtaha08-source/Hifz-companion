import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../quran/quran_service.dart';

class AyahHifzPage extends StatefulWidget {
  const AyahHifzPage({super.key, required this.surahNumber, required this.surahName});

  final int surahNumber;
  final String surahName;

  @override
  State<AyahHifzPage> createState() => _AyahHifzPageState();
}

class _AyahHifzPageState extends State<AyahHifzPage> {
  static const statuses = <String>['Not started', 'Learning', 'Memorized', 'Needs revision'];
  final Map<int, String> _status = {};
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

  Future<void> _loadStatuses() async {
    final prefs = await SharedPreferences.getInstance();
    final data = await _surah!;
    for (final ayah in data.ayahs) {
      _status[ayah.ayah] = prefs.getString(_key(ayah.ayah)) ?? statuses.first;
    }
    if (!mounted) return;
    setState(() => _loaded = true);
  }

  Future<void> _setStatus(AyahData ayah, String value) async {
    setState(() => _status[ayah.ayah] = value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key(ayah.ayah), value);
    await prefs.setInt('hifz_last_surah', widget.surahNumber);
    await prefs.setInt('hifz_last_ayah', ayah.ayah);
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
    }
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
                    ayah: ayah,
                    status: _status[ayah.ayah] ?? statuses.first,
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
  const _AyahCard({required this.ayah, required this.status, required this.onStatus});

  final AyahData ayah;
  final String status;
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
