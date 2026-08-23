import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class TasbihPage extends StatefulWidget {
  const TasbihPage({super.key});

  @override
  State<TasbihPage> createState() => _TasbihPageState();
}

class _TasbihPageState extends State<TasbihPage> {
  int count = 0;
  int target = 33;
  static const targets = [33, 100, 500, 1000];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      count = prefs.getInt('tasbih_count') ?? 0;
      target = prefs.getInt('tasbih_target') ?? 33;
    });
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('tasbih_count', count);
    await prefs.setInt('tasbih_target', target);
  }

  void _increment([int by = 1]) {
    setState(() => count += by);
    _save();
  }

  void _reset() {
    setState(() => count = 0);
    _save();
  }

  void _setTarget(int value) {
    setState(() => target = value);
    _save();
  }

  @override
  Widget build(BuildContext context) {
    final progress = (count / target).clamp(0, 1).toDouble();

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Column(
            children: [
              Text(
                'Tasbih Counter',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              const Text(
                'Saved locally on this device.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    children: [
                      Text(
                        '$count',
                        style: Theme.of(context).textTheme.displayLarge,
                      ),
                      const SizedBox(height: 8),
                      Text('Target: $target'),
                      const SizedBox(height: 16),
                      LinearProgressIndicator(value: progress),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 130,
                        child: FilledButton(
                          onPressed: _increment,
                          child: const Text('Tap to count'),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _increment(1),
                              child: const Text('+1'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _increment(33),
                              child: const Text('+33'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        children: targets
                            .map(
                              (value) => ChoiceChip(
                                label: Text('$value'),
                                selected: target == value,
                                onSelected: (_) => _setTarget(value),
                              ),
                            )
                            .toList(),
                      ),
                      TextButton(
                        onPressed: _reset,
                        child: const Text('Reset'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
