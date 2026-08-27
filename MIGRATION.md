# Miqra Flutter Migration

This branch is the controlled migration of the existing Hifz Companion product into a single Flutter application.

## Product direction

- Final brand: **Miqra**
- One Flutter codebase for Android and Web
- Existing web implementation is the feature reference during migration
- The old standalone Flutter prototype is not the final product direction
- No feature is considered migrated merely because a placeholder screen exists

## Feature migration order

1. App shell, responsive navigation, light/dark themes, branding and icons
2. Quran reader: Arabic text, dynamic ayah selection, English and Urdu translations, transliteration
3. Audio engine: reciter selection, play/pause/resume/stop, next ayah/surah, repetitions and resilient fallback handling
4. Home: daily dynamic ayah and offline-friendly caching
5. Tasbih: tap-to-count flow, custom targets, presets and persistent history
6. Mutashabihat: migrate the existing flagship Quran similarity data and search workflow
7. Hifz progress and revision scheduling
8. Offline packs and local-first persistence
9. Android release configuration, signing, icons and Play Protect compatibility work
10. Web build and deployment parity

## Migration rule

The main branch remains the currently working reference until the Flutter implementation reaches feature parity. The Flutter migration will then replace the old runtime rather than keeping two competing products.
