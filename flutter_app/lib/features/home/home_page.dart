import 'package:flutter/material.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: constraints.maxWidth > 700 ? 32 : 20, vertical: 24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Assalamu Alaikum', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              const Text('Hifz Companion — an offline-first, cross-platform memorization companion.'),
              const SizedBox(height: 28),
              Card(child: Padding(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Daily Ayah', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                const Text('The native app will rotate through the complete Quran locally once the packaged Quran dataset is migrated.'),
              ])),
              const SizedBox(height: 16),
              Wrap(spacing: 12, runSpacing: 12, children: const [
                _FeatureCard(icon: Icons.download_done_outlined, title: 'Offline packs', subtitle: 'Planned for Quran text, translations and selected audio.'),
                _FeatureCard(icon: Icons.repeat_outlined, title: 'Revision', subtitle: 'Spaced revision and Hifz tracking migration.'),
                _FeatureCard(icon: Icons.compare_arrows_outlined, title: 'Mutashabihat', subtitle: 'Native search/index migration after the reader data layer.'),
              ]),
            ]),
          ),
        ),
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({required this.icon, required this.title, required this.subtitle});
  final IconData icon;
  final String title;
  final String subtitle;
  @override
  Widget build(BuildContext context) => SizedBox(width: 260, child: Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(icon), const SizedBox(height: 12), Text(title, style: Theme.of(context).textTheme.titleMedium), const SizedBox(height: 6), Text(subtitle)]))));
}
