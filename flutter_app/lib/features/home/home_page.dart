import 'package:flutter/material.dart';

import '../quran/quran_service.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key, required this.onNavigate});

  final ValueChanged<int> onNavigate;

  int get _dailyAyahNumber {
    final day = DateTime.now().toUtc().difference(DateTime.utc(2024, 1, 1)).inDays;
    return (day % 6236) + 1;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: constraints.maxWidth > 700 ? 32 : 20, vertical: 24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 980),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Assalamu Alaikum', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text('Your Quran and Hifz companion — Arabic, translations, recitation and memorization tools in one place.', style: theme.textTheme.bodyLarge),
                const SizedBox(height: 24),
                Text('Daily Ayah', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 10),
                FutureBuilder<AyahData>(
                  future: QuranService.loadAyah(_dailyAyahNumber),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Card(child: Padding(padding: EdgeInsets.all(30), child: Center(child: CircularProgressIndicator())));
                    }
                    if (snapshot.hasError || !snapshot.hasData) {
                      return Card(child: Padding(padding: const EdgeInsets.all(20), child: Text('Today\'s ayah could not be loaded. Open Reader and try again when connected.')));
                    }
                    final ayah = snapshot.data!;
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(22),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(children: [
                              Text('Surah ${ayah.surah} • Ayah ${ayah.ayah}', style: theme.textTheme.labelLarge),
                              const Spacer(),
                              const Icon(Icons.calendar_today_outlined, size: 18),
                            ]),
                            const SizedBox(height: 18),
                            Text(ayah.arabic, textDirection: TextDirection.rtl, textAlign: TextAlign.right, style: const TextStyle(fontSize: 28, height: 1.9)),
                            const SizedBox(height: 14),
                            Text(ayah.transliteration, style: const TextStyle(fontStyle: FontStyle.italic)),
                            const SizedBox(height: 10),
                            Text(ayah.english, style: theme.textTheme.bodyLarge),
                            const SizedBox(height: 10),
                            Text(ayah.urdu, textDirection: TextDirection.rtl, textAlign: TextAlign.right, style: theme.textTheme.bodyLarge),
                            const SizedBox(height: 16),
                            Align(alignment: Alignment.centerRight, child: FilledButton.icon(onPressed: () => onNavigate(1), icon: const Icon(Icons.menu_book_rounded), label: const Text('Open Quran Reader'))),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),
                Text('Quick actions', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    _ActionCard(icon: Icons.menu_book_rounded, title: 'Quran Reader', subtitle: 'Read the complete Quran with translations and transliteration.', onTap: () => onNavigate(1)),
                    _ActionCard(icon: Icons.play_circle_outline_rounded, title: 'Recitation', subtitle: 'Choose a reciter, play ayahs, repeat and continue.', onTap: () => onNavigate(1)),
                    _ActionCard(icon: Icons.add_circle_outline_rounded, title: 'Tasbih', subtitle: 'Keep your dhikr count with a custom target.', onTap: () => onNavigate(2)),
                    _ActionCard(icon: Icons.auto_graph_rounded, title: 'My Hifz', subtitle: 'Progress and revision tools are being expanded.', onTap: () => onNavigate(3)),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({required this.icon, required this.title, required this.subtitle, required this.onTap});
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: 300,
        child: Card(
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(icon, size: 28),
                  const SizedBox(height: 14),
                  Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(subtitle),
                ],
              ),
            ),
          ),
        ),
      );
}
