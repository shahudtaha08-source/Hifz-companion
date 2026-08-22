# Hifz Companion — Flutter Copy

This directory is intentionally separate from the production Next.js app. It is the native Flutter migration track, not a replacement for the working web app.

## Current native implementation

- Responsive Material 3 app shell
- System light/dark theme
- Offline-persistent Tasbih counter using `shared_preferences`
- Dashboard shell
- Reader and Hifz migration placeholders

## Next migration milestones

1. Package the Quran text + English/Urdu translations for local device storage.
2. Build the native Quran reader with the same Ayah selection model.
3. Port Hifz progress and revision scheduling to local SQLite/Drift.
4. Port Mutashabihat index and comparison UI.
5. Add downloadable audio packs and background playback.
6. Add optional account/cloud sync without making offline use dependent on an account.

## Run locally

From this directory:

```bash
flutter create .
flutter pub get
flutter run
```

`flutter create .` generates the Android/iOS/Linux/macOS/Windows/web platform folders while keeping this source scaffold intact.
