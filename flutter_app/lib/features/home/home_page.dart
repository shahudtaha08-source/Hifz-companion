import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../quran/quran_service.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key, required this.onNavigate});

  final ValueChanged<int> onNavigate;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  late DateTime _today;
  Timer? _midnightTimer;

  @override
  void initState() {
    super.initState();
    _today = _dateOnly(DateTime.now());
    _scheduleMidnightRefresh();
  }

  DateTime _dateOnly(DateTime value) => DateTime(value.year, value.month, value.day);

  int get _dailyAyahNumber {
    final day = _today.difference(DateTime(2024, 1, 1)).inDays;
    return (day % 6236) + 1;
  }

  void _scheduleMidnightRefresh() {
    _midnightTimer?.cancel();
    final now = DateTime.now();
    final nextMidnight = DateTime(now.year, now.month, now.day + 1);
    _midnightTimer = Timer(nextMidnight.difference(now) + const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() => _today = _dateOnly(DateTime.now()));
      _scheduleMidnightRefresh();
    });
  }

  @override
  void dispose() {
    _midnightTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dailyAyahNumber = _dailyAyahNumber;
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: constraints.maxWidth > 700 ? 32 : 20, vertical: 24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 980),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [BoxShadow(color: theme.colorScheme.primary.withValues(alpha: 0.18), blurRadius: 20, spreadRadius: 1)],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: SvgPicture.asset('assets/nuur_path_logo.svg'),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Nuur Path', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900, letterSpacing: -0.6)),
                          const SizedBox(height: 2),
                          Text('Your journey. His words.', style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text('Assalamu Alaikum', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text('Read, listen, memorize and stay consistent — Arabic, translations, recitation and Hifz tools in one place.', style: theme.textTheme.bodyLarge),
                const SizedBox(height: 28),
                Row(children: [
                  Text('Daily Ayah', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                  const Spacer(),
                  Text('${_today.day.toString().padLeft(2, '0')}/${_today.month.toString().padLeft(2, '0')}/${_today.year}', style: theme.textTheme.labelMedium),
                ]),
                const SizedBox(height: 10),
                FutureBuilder<AyahData>(
                  key: ValueKey(dailyAyahNumber),
                  future: QuranService.loadAyah(dailyAyahNumber),
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
                            Align(alignment: Alignment.centerRight, child: FilledButton.icon(onPressed: () => widget.onNavigate(1), icon: const Icon(Icons.menu_book_rounded), label: const Text('Open Quran Reader'))),
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
                    _ActionCard(icon: Icons.menu_book_rounded, title: 'Quran Reader', subtitle: 'Read the complete Quran with translations and transliteration.', onTap: () => widget.onNavigate(1)),
                    _ActionCard(icon: Icons.play_circle_outline_rounded, title: 'Recitation', subtitle: 'Choose a reciter, play ayahs, repeat and continue.', onTap: () => widget.onNavigate(1)),
                    _ActionCard(icon: Icons.add_circle_outline_rounded, title: 'Tasbih', subtitle: 'Keep your dhikr count with a custom target.', onTap: () => widget.onNavigate(2)),
                    _ActionCard(icon: Icons.auto_graph_rounded, title: 'My Hifz', subtitle: 'Progress and revision tools are under active development.', onTap: () => widget.onNavigate(3)),
                  ],
                ),
                const SizedBox(height: 32),
                Text('Nuur Path • Your journey, His words.', textAlign: TextAlign.center, style: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
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
