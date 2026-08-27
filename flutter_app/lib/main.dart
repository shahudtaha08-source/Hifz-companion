import 'package:flutter/material.dart';

import 'core/app_theme.dart';
import 'features/home/home_page.dart';
import 'features/mutashabihat/mutashabihat_page.dart';
import 'features/quran/quran_reader_page.dart';
import 'features/tasbih/tasbih_page.dart';

void main() => runApp(const MiqraApp());

class MiqraApp extends StatefulWidget {
  const MiqraApp({super.key});

  @override
  State<MiqraApp> createState() => _MiqraAppState();
}

class _MiqraAppState extends State<MiqraApp> {
  ThemeMode _themeMode = ThemeMode.system;

  void _toggleTheme() {
    setState(() {
      final platformDark = WidgetsBinding.instance.platformDispatcher.platformBrightness == Brightness.dark;
      final currentlyDark = _themeMode == ThemeMode.dark || (_themeMode == ThemeMode.system && platformDark);
      _themeMode = currentlyDark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Miqra',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: _themeMode,
      home: AppShell(onToggleTheme: _toggleTheme),
    );
  }
}

class AppShell extends StatefulWidget {
  const AppShell({super.key, required this.onToggleTheme});
  final VoidCallback onToggleTheme;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int index = 0;
  void _navigate(int value) => setState(() => index = value);

  @override
  Widget build(BuildContext context) {
    // The navigation now follows the actual Hifz Companion product structure.
    // Flutter is being migrated from the working web app feature-by-feature;
    // this is not a separate placeholder product.
    final pages = [
      HomePage(onNavigate: _navigate, onToggleTheme: widget.onToggleTheme),
      const QuranReaderPage(),
      const _MyHifzPage(),
      const MutashabihatPage(),
      const TasbihPage(),
    ];

    return Scaffold(
      body: SafeArea(child: IndexedStack(index: index, children: pages)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        onDestinationSelected: _navigate,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home_rounded), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.menu_book_outlined), selectedIcon: Icon(Icons.menu_book_rounded), label: 'Quran'),
          NavigationDestination(icon: Icon(Icons.auto_graph_outlined), selectedIcon: Icon(Icons.auto_graph_rounded), label: 'My Hifz'),
          NavigationDestination(icon: Icon(Icons.auto_awesome_motion_outlined), selectedIcon: Icon(Icons.auto_awesome_motion_rounded), label: 'Mutashabihat'),
          NavigationDestination(icon: Icon(Icons.add_circle_outline), selectedIcon: Icon(Icons.add_circle_rounded), label: 'Tasbih'),
        ],
      ),
    );
  }
}

class _MyHifzPage extends StatelessWidget {
  const _MyHifzPage();

  @override
  Widget build(BuildContext context) => const _ConstructionPage(
        icon: Icons.auto_graph_rounded,
        eyebrow: 'MIGRATING FROM THE WORKING APP',
        title: 'My Hifz',
        body: 'This screen is being rebuilt from the existing Hifz Companion Hifz workflow, including memorization status, revision and weak-ayah tracking.',
        items: [
          'Continue memorizing from the current ayah',
          'Track memorized, learning, weak and revision states',
          'Revision queue and weak-ayah review',
          'Local-first progress with export/import later',
        ],
      );
}

class _ConstructionPage extends StatelessWidget {
  const _ConstructionPage({required this.icon, required this.eyebrow, required this.title, required this.body, required this.items});
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
                      decoration: BoxDecoration(color: scheme.primaryContainer, borderRadius: BorderRadius.circular(18)),
                      child: Icon(icon, size: 30, color: scheme.onPrimaryContainer),
                    ),
                    const SizedBox(height: 24),
                    Text(eyebrow, style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w800, letterSpacing: 1)),
                    const SizedBox(height: 8),
                    Text(title, style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    Text(body, style: theme.textTheme.bodyLarge),
                    const SizedBox(height: 24),
                    ...items.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.check_circle_outline_rounded, color: scheme.primary, size: 20),
                          const SizedBox(width: 10),
                          Expanded(child: Text(item)),
                        ],
                      ),
                    )),
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
