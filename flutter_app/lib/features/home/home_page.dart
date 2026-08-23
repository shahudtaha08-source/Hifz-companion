import 'package:flutter/material.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key, required this.onNavigate});

  final ValueChanged<int> onNavigate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(
          constraints.maxWidth > 700 ? 40 : 20,
          28,
          constraints.maxWidth > 700 ? 40 : 20,
          28,
        ),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1000),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    gradient: LinearGradient(
                      colors: [
                        scheme.primaryContainer,
                        scheme.surfaceContainerHighest,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: scheme.surface.withValues(alpha: 0.72),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text(
                          'OFFLINE-FIRST HIFZ COMPANION',
                          style: theme.textTheme.labelMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      const SizedBox(height: 22),
                      Text(
                        'Assalamu Alaikum',
                        style: theme.textTheme.headlineLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'A calm place for your daily Quran and Hifz routine.',
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(height: 24),
                      FilledButton.icon(
                        onPressed: () => onNavigate(1),
                        icon: const Icon(Icons.menu_book_rounded),
                        label: const Text('Open Quran Reader'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text('Today', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                Card(
                  clipBehavior: Clip.antiAlias,
                  child: Padding(
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.auto_awesome_rounded, color: scheme.primary),
                            const SizedBox(width: 10),
                            Text('Daily Ayah', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Your daily ayah will rotate from the complete packaged Quran as the offline reader dataset is migrated.',
                          style: theme.textTheme.bodyLarge,
                        ),
                        const SizedBox(height: 16),
                        TextButton.icon(
                          onPressed: () => onNavigate(1),
                          icon: const Icon(Icons.arrow_forward_rounded),
                          label: const Text('Go to Reader'),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text('Quick actions', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 14,
                  runSpacing: 14,
                  children: [
                    _QuickAction(
                      width: constraints.maxWidth > 760 ? 300 : (constraints.maxWidth - 54).clamp(240, 520).toDouble(),
                      icon: Icons.add_circle_outline_rounded,
                      title: 'Tasbih',
                      subtitle: 'Tap once for each dhikr, with your own target.',
                      onTap: () => onNavigate(2),
                    ),
                    _QuickAction(
                      width: constraints.maxWidth > 760 ? 300 : (constraints.maxWidth - 54).clamp(240, 520).toDouble(),
                      icon: Icons.auto_graph_rounded,
                      title: 'My Hifz',
                      subtitle: 'Track progress and revision as the offline layer expands.',
                      onTap: () => onNavigate(3),
                    ),
                    _QuickAction(
                      width: constraints.maxWidth > 760 ? 300 : (constraints.maxWidth - 54).clamp(240, 520).toDouble(),
                      icon: Icons.cloud_off_rounded,
                      title: 'Offline packs',
                      subtitle: 'Quran text, translations and selected audio are being prepared.',
                      onTap: () => onNavigate(1),
                    ),
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

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.width,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final double width;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return SizedBox(
      width: width,
      child: Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: scheme.primaryContainer,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: scheme.onPrimaryContainer),
                ),
                const SizedBox(height: 18),
                Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(subtitle, maxLines: 2, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
