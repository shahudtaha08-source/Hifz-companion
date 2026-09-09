import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'audio_pack_service.dart';
import 'quran_audio_controller.dart';
import 'quran_service.dart';

class AudioPackButton extends StatefulWidget {
  const AudioPackButton({super.key, required this.reciter, required this.surah});
  final Reciter reciter;
  final SurahData surah;
  @override State<AudioPackButton> createState() => _AudioPackButtonState();
}

class _AudioPackButtonState extends State<AudioPackButton> {
  int _done = 0;
  bool _busy = false;
  bool _downloaded = false;
  String? _error;

  @override
  void initState() { super.initState(); if (!kIsWeb) _refresh(); }
  @override
  void didUpdateWidget(covariant AudioPackButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!kIsWeb && (oldWidget.reciter.id != widget.reciter.id || oldWidget.surah.number != widget.surah.number)) _refresh();
  }

  Future<void> _refresh() async {
    final count = await AudioPackService.downloadedCount(widget.reciter.id, widget.surah.number, widget.surah.ayahs.length);
    if (!mounted) return;
    setState(() { _done = count; _downloaded = count == widget.surah.ayahs.length; });
  }

  Future<void> _download() async {
    if (_busy || _downloaded || kIsWeb) return;
    setState(() { _busy = true; _error = null; });
    final sources = widget.surah.ayahs.map((ayah) => <String>[widget.reciter.cdnUrlFor(ayah), ...widget.reciter.everyAyahUrlsFor(ayah)]).toList();
    try {
      await AudioPackService.downloadSurah(reciterId: widget.reciter.id, surah: widget.surah.number, sourcesByAyah: sources, onProgress: (done, total) { if (mounted) setState(() => _done = done); });
      if (mounted) setState(() { _downloaded = true; _busy = false; });
    } catch (error) {
      if (mounted) setState(() { _busy = false; _error = 'Download stopped: $error'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      OutlinedButton.icon(
        onPressed: _busy || _downloaded ? null : _download,
        icon: _busy ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(value: widget.surah.ayahs.isEmpty ? 0 : _done / widget.surah.ayahs.length, strokeWidth: 2)) : Icon(_downloaded ? Icons.offline_pin_rounded : Icons.download_rounded),
        label: Text(_downloaded ? 'Surah audio available offline' : _busy ? 'Downloading $_done/${widget.surah.ayahs.length} ayahs…' : 'Download Surah audio for offline use'),
      ),
      if (_error != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 12))),
      if (_done > 0 && !_downloaded && !_busy) Padding(padding: const EdgeInsets.only(top: 4), child: Text('$_done/${widget.surah.ayahs.length} ayahs already downloaded; resume will continue from there.', style: Theme.of(context).textTheme.bodySmall)),
    ]);
  }
}
