import 'package:flutter/material.dart';

class MutashabihatPage extends StatefulWidget {
  const MutashabihatPage({super.key});

  @override
  State<MutashabihatPage> createState() => _MutashabihatPageState();
}

class _MutashabihatPageState extends State<MutashabihatPage> {
  final _search = TextEditingController();
  _MutashabihatRecord? _selected;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final query = _search.text.trim().toLowerCase();
    final matches = _records.where((record) {
      if (query.isEmpty) return true;
      return record.source.reference.toLowerCase().contains(query) ||
          record.target.reference.toLowerCase().contains(query) ||
          record.category.toLowerCase().contains(query) ||
          record.reason.toLowerCase().contains(query) ||
          record.source.arabic.contains(_search.text.trim()) ||
          record.target.arabic.contains(_search.text.trim());
    }).toList();

    return SafeArea(
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(constraints.maxWidth > 700 ? 40 : 18, 24, constraints.maxWidth > 700 ? 40 : 18, 100),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 900),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(Icons.auto_awesome_motion_rounded, color: theme.colorScheme.onPrimaryContainer),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Mutashabihat Finder', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                            const SizedBox(height: 3),
                            Text('Find similar and easily confused Quranic passages', style: theme.textTheme.bodyMedium),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.secondaryContainer.withValues(alpha: 0.55),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.workspace_premium_rounded, color: theme.colorScheme.onSecondaryContainer),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Flagship Hifz tool • This Flutter build includes an offline-ready starter Mutashabihat index and side-by-side comparison. The full 6,236-ayah index can be bundled into the native data pack in the next data migration.',
                            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSecondaryContainer),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: _search,
                    onChanged: (_) => setState(() {}),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: _search.text.isEmpty
                          ? null
                          : IconButton(
                              tooltip: 'Clear',
                              onPressed: () {
                                _search.clear();
                                setState(() {});
                              },
                              icon: const Icon(Icons.close_rounded),
                            ),
                      hintText: 'Search by Surah, ayah, phrase or category',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text('${matches.length} comparison${matches.length == 1 ? '' : 's'} in the local index', style: theme.textTheme.labelMedium),
                  const SizedBox(height: 10),
                  if (matches.isEmpty)
                    _EmptyState(onClear: () {
                      _search.clear();
                      setState(() {});
                    })
                  else
                    ...matches.map((record) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _MatchCard(
                            record: record,
                            onCompare: () => setState(() => _selected = record),
                          ),
                        )),
                ],
              ),
            ),
          ),
        ),
      ),
    ).letWithOverlay(context, _selected, (record) => _ComparisonSheet(
          record: record,
          onClose: () => setState(() => _selected = null),
        ));
  }
}

extension _OverlayBuilder on Widget {
  Widget letWithOverlay(BuildContext context, _MutashabihatRecord? selected, Widget Function(_MutashabihatRecord) overlay) {
    if (selected == null) return this;
    return Stack(
      children: [
        this,
        Positioned.fill(
          child: Material(
            color: Colors.black54,
            child: SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(18),
                  child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 860), child: overlay(selected)),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onClear});
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Icon(Icons.search_off_rounded, size: 42),
              const SizedBox(height: 10),
              const Text('No local comparison found.'),
              TextButton(onPressed: onClear, child: const Text('Clear search')),
            ],
          ),
        ),
      );
}

class _MatchCard extends StatelessWidget {
  const _MatchCard({required this.record, required this.onCompare});
  final _MutashabihatRecord record;
  final VoidCallback onCompare;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(label: Text(record.category)),
                Chip(avatar: const Icon(Icons.percent_rounded, size: 16), label: Text('${record.coverage}% match')),
              ],
            ),
            const SizedBox(height: 10),
            Text('${record.source.reference}  ↔  ${record.target.reference}', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(record.reason, style: theme.textTheme.bodySmall),
            const SizedBox(height: 12),
            Text(record.source.arabic, textAlign: TextAlign.right, textDirection: TextDirection.rtl, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, height: 1.8)),
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.tonalIcon(
                onPressed: onCompare,
                icon: const Icon(Icons.compare_arrows_rounded),
                label: const Text('Compare differences'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ComparisonSheet extends StatelessWidget {
  const _ComparisonSheet({required this.record, required this.onClose});
  final _MutashabihatRecord record;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text('Side-by-side comparison', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800))),
                IconButton(onPressed: onClose, icon: const Icon(Icons.close_rounded)),
              ],
            ),
            const SizedBox(height: 8),
            Text(record.reason, style: theme.textTheme.bodySmall),
            const SizedBox(height: 16),
            _AyahPanel(label: record.source.reference, ayah: record.source),
            const SizedBox(height: 12),
            Center(child: Icon(Icons.compare_arrows_rounded, color: theme.colorScheme.primary)),
            const SizedBox(height: 12),
            _AyahPanel(label: record.target.reference, ayah: record.target),
            const SizedBox(height: 16),
            Text('Hifz cue', style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 4),
            Text(record.hifzCue),
          ],
        ),
      ),
    );
  }
}

class _AyahPanel extends StatelessWidget {
  const _AyahPanel({required this.label, required this.ayah});
  final String label;
  final _AyahSnippet ayah;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: theme.colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          SelectableText(ayah.arabic, textAlign: TextAlign.right, textDirection: TextDirection.rtl, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, height: 1.9)),
          const SizedBox(height: 8),
          Text(ayah.note, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _AyahSnippet {
  const _AyahSnippet(this.reference, this.arabic, this.note);
  final String reference;
  final String arabic;
  final String note;
}

class _MutashabihatRecord {
  const _MutashabihatRecord({
    required this.category,
    required this.coverage,
    required this.reason,
    required this.hifzCue,
    required this.source,
    required this.target,
  });
  final String category;
  final int coverage;
  final String reason;
  final String hifzCue;
  final _AyahSnippet source;
  final _AyahSnippet target;
}

const _records = <_MutashabihatRecord>[
  _MutashabihatRecord(
    category: 'Near-exact wording',
    coverage: 91,
    reason: 'The same group of people and the same promise appear, but the order and grammar change.',
    hifzCue: 'Remember: Al-Baqarah says وَالصَّابِئِينَ, while Al-Ma’idah says وَالصَّابِئُونَ.',
    source: _AyahSnippet('Al-Baqarah 2:62', 'إِنَّ الَّذِينَ آمَنُوا وَالَّذِينَ هَادُوا وَالنَّصَارَىٰ وَالصَّابِئِينَ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ وَعَمِلَ صَالِحًا فَلَهُمْ أَجْرُهُمْ عِنْدَ رَبِّهِمْ وَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ', 'Order: believers → Jews → Christians → Sabians.'),
    target: _AyahSnippet('Al-Ma’idah 5:69', 'إِنَّ الَّذِينَ آمَنُوا وَالَّذِينَ هَادُوا وَالصَّابِئُونَ وَالنَّصَارَىٰ مَنْ آمَنَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ وَعَمِلَ صَالِحًا فَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ', 'Order and grammatical ending change.'),
  ),
  _MutashabihatRecord(
    category: 'Near-exact phrase',
    coverage: 88,
    reason: 'Both ayahs describe prohibited food and the same exception for necessity, with small wording differences.',
    hifzCue: 'Anchor the opening with حُرِّمَ عَلَيْكُمُ in 2:173 and إِنَّمَا حَرَّمَ عَلَيْكُمُ in 16:115.',
    source: _AyahSnippet('Al-Baqarah 2:173', 'إِنَّمَا حَرَّمَ عَلَيْكُمُ الْمَيْتَةَ وَالدَّمَ وَلَحْمَ الْخِنْزِيرِ وَمَا أُهِلَّ بِهِ لِغَيْرِ اللَّهِ', 'The familiar food prohibition passage.'),
    target: _AyahSnippet('An-Nahl 16:115', 'إِنَّمَا حَرَّمَ عَلَيْكُمُ الْمَيْتَةَ وَالدَّمَ وَلَحْمَ الْخِنْزِيرِ وَمَا أُهِلَّ لِغَيْرِ اللَّهِ بِهِ', 'The بِهِ placement is the key difference.'),
  ),
  _MutashabihatRecord(
    category: 'Similar structure',
    coverage: 79,
    reason: 'Both passages use guidance-following as the trigger for safety from fear and grief, but the endings differ.',
    hifzCue: '2:38 ends with فَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ; 20:123 uses فَلَا يَضِلُّ وَلَا يَشْقَىٰ.',
    source: _AyahSnippet('Al-Baqarah 2:38', 'فَمَنْ تَبِعَ هُدَايَ فَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ', 'Guidance leads to no fear and no grief.'),
    target: _AyahSnippet('Ta-Ha 20:123', 'فَمَنِ اتَّبَعَ هُدَايَ فَلَا يَضِلُّ وَلَا يَشْقَىٰ', 'Guidance leads to not going astray and not suffering.'),
  ),
  _MutashabihatRecord(
    category: 'Exact full ayah',
    coverage: 100,
    reason: 'The ayah is repeated word-for-word for emphasis.',
    hifzCue: 'When reciting Ash-Sharh, expect the exact repetition immediately after the first occurrence.',
    source: _AyahSnippet('Ash-Sharh 94:5', 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', 'First occurrence.'),
    target: _AyahSnippet('Ash-Sharh 94:6', 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', 'Repeated wording; notice the opening فَ is absent.'),
  ),
  _MutashabihatRecord(
    category: 'Exact phrase',
    coverage: 76,
    reason: 'The core declaration of Allah’s absolute uniqueness and the names Al-Hayy, Al-Qayyum appear in both locations.',
    hifzCue: '3:2 is concise; 2:255 continues into Ayat al-Kursi.',
    source: _AyahSnippet('Al-Baqarah 2:255', 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', 'Opening of Ayat al-Kursi.'),
    target: _AyahSnippet('Aal Imran 3:2', 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', 'The same phrase as a complete ayah.'),
  ),
];
