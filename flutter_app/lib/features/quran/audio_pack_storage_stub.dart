class AudioPackStorage {
  static Future<String?> localPath(String reciterId, int surah, int ayah) async => null;
  static Future<bool> exists(String reciterId, int surah, int ayah) async => false;
  static Future<void> save(String reciterId, int surah, int ayah, List<int> bytes) async {}
}
