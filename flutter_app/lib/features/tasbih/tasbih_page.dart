import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class TasbihPage extends StatefulWidget {
  const TasbihPage({super.key});

  @override
  State<TasbihPage> createState() => _TasbihPageState();
}

class _TasbihPageState extends State<TasbihPage> {
  static const _presetTargets = [33, 99, 100, 500, 1000];

  int _count = 0;
  int _target = 33;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _count = prefs.getInt('tasbih_count') ?? 0;
      _target = prefs.getInt('tasbih_target') ?? 33;
      if (_target < 1) _target = 33;
      if (_count > _target) _count = _target;
      _loaded = true;
    });
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('tasbih_count', _count);
    await prefs.setInt('tasbih_target', _target);
  }

  void _increment() {
    if (_count >= _target) return;
    setState(() => _count++);
    _save();
  }

  void _undo() {
    if (_count <= 0) return;
    setState(() => _count--);
    _save();
  }

  void _reset() {
    setState(() => _count = 0);
    _save();
  }

  void _setTarget(int value) {
    if (value < 1) return;
    setState(() {
      _target = value;
      _count = 0;
    });
    _save();
  }

  Future<void> _showCustomTargetDialog() async {
    final controller = TextEditingController(text: _target.toString());
    final value = await showDialog<int>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Set custom target'),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Target count',
            hintText: 'Example: 33',
            border: OutlineInputBorder(),
          ),
          onSubmitted: (text) {
            final parsed = int.tryParse(text.trim());
            if (parsed != null && parsed > 0) Navigator.pop(context, parsed);
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final parsed = int.tryParse(controller.text.trim());
              if (parsed != null && parsed > 0) Navigator.pop(context, parsed);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (value != null) _setTarget(value);
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded) return const Center(child: CircularProgressIndicator());

    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final complete = _count >= _target;
    final progress = (_count / _target).clamp(0, 1).toDouble();
    final remaining = (_target - _count).clamp(0, _target);

    return SafeArea(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final horizontalPadding = constraints.maxWidth < 600 ? 20.0 : 32.0;
          return Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(horizontalPadding, 24, horizontalPadding, 32),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 620),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Tasbih',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Your count is saved on this device',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                    const SizedBox(height: 28),
                    Card(
                      clipBehavior: Clip.antiAlias,
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            Text(
                              complete ? 'Target completed' : 'Current count',
                              style: theme.textTheme.labelLarge?.copyWith(color: scheme.onSurfaceVariant),
                            ),
                            const SizedBox(height: 8),
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 180),
                              child: Text(
                                '$_count',
                                key: ValueKey(_count),
                                style: theme.textTheme.displayLarge?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: complete ? scheme.primary : scheme.onSurface,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Target $_target  •  $remaining remaining',
                              style: theme.textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant),
                            ),
                            const SizedBox(height: 20),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(999),
                              child: LinearProgressIndicator(
                                value: progress,
                                minHeight: 10,
                                backgroundColor: scheme.surfaceContainerHighest,
                              ),
                            ),
                            const SizedBox(height: 28),
                            SizedBox(
                              width: double.infinity,
                              height: 160,
                              child: FilledButton(
                                onPressed: complete ? null : _increment,
                                style: FilledButton.styleFrom(
                                  shape: const StadiumBorder(),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(complete ? Icons.check_circle_rounded : Icons.touch_app_rounded, size: 34),
                                    const SizedBox(height: 10),
                                    Text(
                                      complete ? 'Completed' : 'Tap once to count +1',
                                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: _count > 0 ? _undo : null,
                                    icon: const Icon(Icons.undo_rounded),
                                    label: const Text('Undo'),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: _count > 0 ? _reset : null,
                                    icon: const Icon(Icons.restart_alt_rounded),
                                    label: const Text('Reset'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Target', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                                      const SizedBox(height: 2),
                                      Text('Choose a preset or set your own goal', style: theme.textTheme.bodySmall),
                                    ],
                                  ),
                                ),
                                TextButton.icon(
                                  onPressed: _showCustomTargetDialog,
                                  icon: const Icon(Icons.edit_outlined),
                                  label: const Text('Custom'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _presetTargets
                                  .map(
                                    (value) => ChoiceChip(
                                      label: Text('$value'),
                                      selected: _target == value,
                                      onSelected: (_) => _setTarget(value),
                                    ),
                                  )
                                  .toList(),
                            ),
                            if (!_presetTargets.contains(_target)) ...[
                              const SizedBox(height: 10),
                              Chip(
                                avatar: const Icon(Icons.tune_rounded, size: 18),
                                label: Text('Custom: $_target'),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
