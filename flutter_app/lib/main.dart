import 'package:flutter/material.dart';

import 'core/app_theme.dart';
import 'features/home/home_page.dart';
import 'features/tasbih/tasbih_page.dart';

void main() => runApp(const HifzCompanionApp());

class HifzCompanionApp extends StatelessWidget {
  const HifzCompanionApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Hifz Companion',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      home: const AppShell(),
    );
  }
}

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int index = 0;

  void _navigate(int value) => setState(() => index = value);

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomePage(onNavigate: _navigate),
      const _ReaderPlaceholder(),
      const TasbihPage(),
      const _ProgressPlaceholder(),
    ];

    return Scaffold(
      body: SafeArea(child: IndexedStack(index: index, children: pages)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        onDestinationSelected: _navigate,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home_rounded), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.menu_book_outlined), selectedIcon: Icon(Icons.menu_book_rounded), label: 'Reader'),
          NavigationDestination(icon: Icon(Icons.add_circle_outline), selectedIcon: Icon(Icons.add_circle_rounded), label: 'Tasbih'),
          NavigationDestination(icon: Icon(Icons.auto_graph_outlined), selectedIcon: Icon(Icons.auto_graph_rounded), label: 'Progress'),
        ],
      ),
    );
  }
}

class _ReaderPlaceholder extends StatelessWidget {
  const _ReaderPlaceholder();

  @override
  Widget build(BuildContext context) => const _ConstructionPage(
        icon: Icons.menu_book_rounded,
        eyebrow: 'NEXT MAJOR MILESTONE',
        title: 'Quran Reader',
        body: 'The Flutter reader is now the next major migration. The existing web reader remains the reference while Quran text, English translations, audio sync and Hifz tools are moved into the offline app.',
        items: [
          'Complete Quran data packaged locally',
          'Arabic and English translation support',
          'Ayah-by-ayah audio synchronization',
          'Reciters, repeats and memorization tools',
        ],
      );
}

class _ProgressPlaceholder extends StatelessWidget {
  const _ProgressPlaceholder();

  @override
  Widget build(BuildContext context) => const _ConstructionPage(
        icon: Icons.auto_graph_rounded,
        eyebrow: 'UNDER DEVELOPMENT',
        title: 'My Hifz',
        body: 'Your progress area will become the offline home for memorization status, revision planning and future device sync.',
        items: [
          'Per-surah and per-ayah progress',
          'Revision scheduling',
          'Local-first data storage',
          'Future optional sync',
        ],
      );
}

class _ConstructionPage extends StatelessWidget {
  const _ConstructionPage({
    required this.icon,
    required this.eyebrow,
    required this.title,
    required this.body,
    required this.items,
  });

  final IconData icon;
  final String eyebrow;
  final String title;
  final String body;
  final List<String> items;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        padding: EdgeInsets.all(constraints.maxWidth > 700 ? 40 : 22),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 760),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: scheme.primaryContainer,
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Icon(icon, size: 30, color: scheme.onPrimaryContainer),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      eyebrow,
                      style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w800, letterSpacing: 1),
                    ),
                    const SizedBox(height: 8),
                    Text(title, style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    Text(body, style: theme.textTheme.bodyLarge),
                    const SizedBox(height: 24),
                    ...items.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.check_circle_outline_rounded, color: scheme.primary, size: 20),
                            const SizedBox(width: 10),
                            Expanded(child: Text(item)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: scheme.secondaryContainer.withValues(alpha: 0.55),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Text('This section is actively being prepared for the offline Flutter app.'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
