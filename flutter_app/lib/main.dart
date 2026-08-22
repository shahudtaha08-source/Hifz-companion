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

  @override
  Widget build(BuildContext context) {
    final pages = [
      const HomePage(),
      const _ReaderPlaceholder(),
      const TasbihPage(),
      const _ProgressPlaceholder(),
    ];
    return Scaffold(
      body: SafeArea(child: IndexedStack(index: index, children: pages)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.menu_book_outlined), selectedIcon: Icon(Icons.menu_book), label: 'Reader'),
          NavigationDestination(icon: Icon(Icons.add_circle_outline), selectedIcon: Icon(Icons.add_circle), label: 'Tasbih'),
          NavigationDestination(icon: Icon(Icons.auto_graph_outlined), selectedIcon: Icon(Icons.auto_graph), label: 'Progress'),
        ],
      ),
    );
  }
}

class _ReaderPlaceholder extends StatelessWidget {
  const _ReaderPlaceholder();
  @override
  Widget build(BuildContext context) => const _PlaceholderPage(title: 'Quran Reader', body: 'Flutter reader migration is the next milestone. The web app remains the reference implementation.');
}

class _ProgressPlaceholder extends StatelessWidget {
  const _ProgressPlaceholder();
  @override
  Widget build(BuildContext context) => const _PlaceholderPage(title: 'My Hifz', body: 'Offline progress, revision scheduling, and sync will be added after the native reader data layer is migrated.');
}

class _PlaceholderPage extends StatelessWidget {
  const _PlaceholderPage({required this.title, required this.body});
  final String title;
  final String body;
  @override
  Widget build(BuildContext context) => Center(child: Padding(padding: const EdgeInsets.all(24), child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 520), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Text(title, style: Theme.of(context).textTheme.headlineMedium), const SizedBox(height: 16), Text(body, textAlign: TextAlign.center)]))));
}
