import 'dart:io';

import 'package:path_provider/path_provider.dart';

class AudioPackStorage {
  static Future<Directory> _root() async {
    final base = await getApplicationDocumentsDirectory();
    final dir = Directory('${base.path}/miqra_audio_packs');
    if (!dir.existsSync()) await dir.create(recursive: true);
    return dir;
  }

  static Future<String> _path(String reciterId, int surah, int ayah) async {
    final root = await _root();
    final dir = Directory('${root.path}/${_safe(reciterId)}/${surah.toString().padLeft(3, '0')}');
    if (!dir.existsSync()) await dir.create(recursive: true);
    return '${dir.path}/${ayah.toString().padLeft(3, '0')}.mp3';
  }

  static String _safe(String value) => value.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');

  static Future<String?> localPath(String reciterId, int surah, int ayah) async {
    final path = await _path(reciterId, surah, ayah);
    return File(path).existsSync() ? path : null;
  }

  static Future<bool> exists(String reciterId, int surah, int ayah) async =>
      (await localPath(reciterId, surah, ayah)) != null;

  static Future<void> save(String reciterId, int surah, int ayah, List<int> bytes) async {
    final path = await _path(reciterId, surah, ayah);
    final file = File(path);
    final temp = File('$path.part');
    await temp.writeAsBytes(bytes, flush: true);
    await temp.rename(file.path);
  }
}
