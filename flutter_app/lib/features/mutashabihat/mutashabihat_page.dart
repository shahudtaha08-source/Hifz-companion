import 'package:flutter/material.dart';

import '../quran/quran_service.dart';
import 'mutashabihat_service.dart';

class MutashabihatPage extends StatefulWidget {
  const MutashabihatPage({super.key});

  @override
  State<MutashabihatPage> createState() => _MutashabihatPageState();
}

class _MutashabihatPageState extends State<MutashabihatPage> {
  final _controller = TextEditingController();
  AyahData? _selectedAyah;
  List<MutashabihatMatch> _matches = const [];
  String _status = 'Ready to build the complete Quran index';
  bool _indexing = false;
  bool _searching = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _buildIndex() async {
    if (_indexing || MutashabihatService.isReady) return;
    setState(() => _indexing = true);
    try {
      await MutashabihatService.ensureIndexed(onProgress: (loaded, total) {
        if (mounted) setState(() => _status = 'Indexing complete Quran: $loaded / $total ayahs');
      });
      if (mounted) setState(() => _status = 'Complete Quran index ready: 6,236 / 6,236 ayahs');
    } catch (error) {
      if (mounted) setState(() => _status = 'Indexing failed: $error');
    } finally {
      if (mounted) setState(() => _indexing = false);
    }
  }

  Future<void> _search() async {
    final text = _controller.text.trim();
    final match = RegExp(r'^(\d{1,3})\s*[:/]\s*(\d{1,3})$').firstMatch(text);
    if (match == null) {
      setState(() => _status = 'Enter a reference like 2:62 or 5/69.');
      return;
    }
    final surah = int.parse(match.group(1)!);
    final ayah = int.parse(match.group(2)!);
    if (surah < 1 || surah > 114 || ayah < 1) {
      setState(() => _status = 'Please enter a valid Surah:Ayah reference.');
      return;
    }
    setState(() { _searching = true; _status = 'Loading selected ayah…'; });
    try {
      if (!MutashabihatService.isReady) await _buildIndex();
      final data = await QuranService.loadSurah(surah);
      final source = data.ayahs.where((a) => a.ayah == ayah).cast<AyahData?>().firstOrNull;
      if (source == null) throw Exception('Ayah not found');
      final results = MutashabihatService.findForAyah(source);
      if (mounted) setState(() {
        _selectedAyah = source;
        _matches = results;
        _status = '${results.length} Quran-wide similar passages found';
      });
    } catch (error) {
      if (mounted) setState(() => _status = 'Search failed: $error');
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final busy = _indexing || _searching;
    return SafeArea(
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(constraints.maxWidth > 700 ? 40 : 18, 24, constraints.maxWidth > 700 ? 40 : 18, 100),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 960),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, borderRadius: BorderRadius.circular(16)), child: const Icon(Icons.auto_awesome_motion_rounded)),
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Mutashabihat Finder', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                    Text('Complete Quran-wide similarity search • 6,236 ayahs', style: theme.textTheme.bodyMedium),
                  ])),
                ]),
                const SizedBox(height: 18),
                Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Flagship feature', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  const Text('This is not a selective list. The engine indexes the complete Quran, normalizes Arabic wording, finds shared multi-word phrases, and ranks similar passages for side-by-side Hifz comparison.'),
                  const SizedBox(height: 12),
                  Row(children: [Expanded(child: Text(_status, style: theme.textTheme.bodySmall)), if (!MutashabihatService.isReady) FilledButton.tonal(onPressed: busy ? null : _buildIndex, child: Text(_indexing ? 'Indexing…' : 'Build full index'))]),
                ]))),
                const SizedBox(height: 18),
                TextField(
                  controller: _controller,
                  onSubmitted: (_) => _search(),
                  decoration: InputDecoration(
                    hintText: 'Enter an ayah, e.g. 2:62',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: IconButton(onPressed: busy ? null : _search, icon: busy ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.arrow_forward_rounded)),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
                if (_selectedAyah != null) ...[
                  const SizedBox(height: 22),
                  _AyahCard(title: 'Selected ayah • ${_selectedAyah!.surah}:${_selectedAyah!.ayah}', ayah: _selectedAyah!, highlight: null),
                ],
                const SizedBox(height: 18),
                ..._matches.map((match) => Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Wrap(spacing: 8, runSpacing: 8, children: [Chip(label: Text('${match.score}% similarity')), Chip(label: Text('${match.target.surah}:${match.target.ayah}'))]),
                    const SizedBox(height: 8),
                    _AyahCard(title: 'Similar passage', ayah: match.target, highlight: match.shared),
                    const SizedBox(height: 10),
                    Text('Shared phrase: ${match.shared}', textDirection: TextDirection.rtl, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700)),
                  ]))),
                )),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

class _AyahCard extends StatelessWidget {
  const _AyahCard({required this.title, required this.ayah, required this.highlight});
  final String title;
  final AyahData ayah;
  final String? highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(border: Border.all(color: theme.colorScheme.outlineVariant), borderRadius: BorderRadius.circular(14)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        SelectableText(ayah.arabic, textDirection: TextDirection.rtl, textAlign: TextAlign.right, style: theme.textTheme.titleMedium?.copyWith(height: 1.9, fontWeight: FontWeight.w700)),
        if (highlight != null) ...[const SizedBox(height: 8), Text('Match: $highlight', textDirection: TextDirection.rtl, style: theme.textTheme.bodySmall)],
      ]),
    );
  }
}

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}
