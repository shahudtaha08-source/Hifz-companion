# Miqra — Migration Source of Truth

The Flutter app must be a feature migration of the working application deployed at `https://hifz-companion-1.onrender.com/`.

It is **not** a separate demo and it must not invent a different product scope. The working Next.js application in this repository is the source of truth for behaviour, routes and data flow. The Flutter implementation may use a new mobile UI and the new Miqra branding, but the actual product features are migrated from the existing app.

## Source route -> Flutter feature map

- `/` -> Home / Dashboard
  - Quran data readiness and quick stats
  - Hifz progress summary
  - weak ayahs
  - continue Hifz
  - quick actions
- `/reader` -> Quran library
- `/reader/[surahId]` -> Surah reader
  - Arabic Quran text
  - English and Urdu translations
  - Hifz status per ayah
  - selected ayah navigation
  - audio, repetition and reciter controls migrated from the existing implementation
- `/hifz` and `/hifz/continue` -> My Hifz
  - memorized / learning / weak / revision states
  - continue workflow
  - revision scheduling
- `/mutashabihat` -> Mutashabihat
  - use the existing Quran match/index data and preserve this as a flagship feature
- `/tasbih` -> Tasbih
  - real single-step counting
  - user-defined target
  - reset and local persistence
- `/daily` -> Daily Ayah
  - deterministic daily rotation
  - dynamic browse action without overwriting the day's ayah
- `/search` -> Quran search
- `/offline` -> Offline/download state

## Migration order

1. Shared models and local data layer based on the current Quran, translation and Hifz data.
2. Quran library and surah reader with the same functional capabilities as the web app.
3. Audio and reciter playback with stable queueing and retries.
4. My Hifz progress and revision state.
5. Mutashabihat using the current dataset/index.
6. Tasbih and Daily Ayah.
7. Search, offline packs, settings, backup/import-export and notifications.
8. Android and web parity testing.

## Branding

The product is being renamed to **Miqra**. The old public product name, Hifz Companion, is the migration source; the new Flutter app should not present itself as a different unrelated app.
