#!/usr/bin/env bash
set -euo pipefail

flutter create . --platforms android
bash tool/prepare_quran_assets.sh
python3 tool/prepare_android_branding.py
flutter pub get
flutter clean
flutter build apk --release

echo "Miqra APK built with bundled offline Quran data."
echo "Output: build/app/outputs/flutter-apk/app-release.apk"
