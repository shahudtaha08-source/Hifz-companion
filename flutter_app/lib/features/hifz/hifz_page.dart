import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'ayah_hifz_page.dart';

class HifzPage extends StatefulWidget {
  const HifzPage({super.key});
  @override
  State<HifzPage> createState() => _HifzPageState();
}

class _HifzPageState extends State<HifzPage> {
  static const names = ['Al-Fatihah','Al-Baqarah','Ali Imran','An-Nisa','Al-Ma’idah','Al-An’am','Al-A’raf','Al-Anfal','At-Tawbah','Yunus','Hud','Yusuf','Ar-Ra’d','Ibrahim','Al-Hijr','An-Nahl','Al-Isra','Al-Kahf','Maryam','Ta-Ha','Al-Anbiya','Al-Hajj','Al-Mu’minun','An-Nur','Al-Furqan','Ash-Shu’ara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum','Luqman','As-Sajdah','Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir','Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad','Al-Fath','Al-Hujurat','Qaf','Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman','Al-Waqi’ah','Al-Hadid','Al-Mujadila','Al-Hashr','Al-Mumtahanah','As-Saff','Al-Jumu’ah','Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah','Al-Ma’arij','Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan','Al-Mursalat','An-Naba','An-Nazi’at','Abasa','At-Takwir','Al-Infitar','Al-Mutaffifin','Al-Inshiqaq','Al-Buruj','At-Tariq','Al-A’la','Al-Ghashiyah','Al-Fajr','Al-Balad','Ash-Shams','Al-Layl','Ad-Duha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah','Az-Zalzalah','Al-Adiyat','Al-Qari’ah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil','Quraysh','Al-Ma’un','Al-Kawthar','Al-Kafirun','An-Nasr','Al-Masad','Al-Ikhlas','Al-Falaq','An-Nas'];
  static const statuses = ['Not started', 'Learning', 'Memorized', 'Needs revision'];
  final Map<int, String> status = {};
  bool loaded = false;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    final p = await SharedPreferences.getInstance();
    for (var i = 1; i <= 114; i++) {
      status[i] = p.getString('hifz_surah_$i') ?? statuses[0];
    }
    if (mounted) setState(() => loaded = true);
  }

  Future<void> setStatus(int n, String value) async {
    setState(() => status[n] = value);
    final p = await SharedPreferences.getInstance();
    await p.setString('hifz_surah_$n', value);
  }

  Future<void> _continueHifz() async {
    final p = await SharedPreferences.getInstance();
    final n = p.getInt('hifz_last_surah');
    final ayah = p.getInt('hifz_last_ayah');
    if (!mounted) return;
    if (n == null || n < 1 || n > 114) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No Hifz session saved yet. Open a Surah to begin.')));
      return;
    }
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => AyahHifzPage(surahNumber: n, surahName: names[n - 1], initialAyah: ayah),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (!loaded) return const Center(child: CircularProgressIndicator());
    final counts = {for (final s in statuses) s: status.values.where((v) => v == s).length};
    final memorized = counts['Memorized']!;
    final theme = Theme.of(context);
    return LayoutBuilder(
      builder: (context, c) => SingleChildScrollView(
        padding: EdgeInsets.all(c.maxWidth > 760 ? 32 : 18),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 980),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('My Hifz', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    const Text('Track Surahs and open any Surah for ayah-level revision.'),
                  ])),
                  IconButton.filledTonal(
                    tooltip: 'Continue Hifz',
                    onPressed: _continueHifz,
                    icon: const Icon(Icons.play_arrow_rounded),
                  ),
                ]),
                const SizedBox(height: 18),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          Expanded(child: Text('$memorized / 114 Surahs memorized', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800))),
                          Text('${(memorized / 114 * 100).round()}%'),
                        ]),
                        const SizedBox(height: 12),
                        LinearProgressIndicator(value: memorized / 114, minHeight: 9),
                        const SizedBox(height: 16),
                        Wrap(spacing: 8, runSpacing: 8, children: statuses.map((s) => Chip(label: Text('$s: ${counts[s]}'))).toList()),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                ...List.generate(114, (i) {
                  final n = i + 1;
                  final s = status[n]!;
                  return Card(
                    margin: const EdgeInsets.only(bottom: 7),
                    child: ListTile(
                      leading: CircleAvatar(child: Text('$n')),
                      title: Text(names[i], style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text(s),
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => AyahHifzPage(surahNumber: n, surahName: names[i]))),
                      trailing: PopupMenuButton<String>(
                        initialValue: s,
                        onSelected: (v) => setStatus(n, v),
                        itemBuilder: (_) => statuses.map((x) => PopupMenuItem(value: x, child: Text(x))).toList(),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
