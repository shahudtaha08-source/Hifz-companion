#!/usr/bin/env bash
set -euo pipefail

flutter create . --platforms android
python3 tool/prepare_android_branding.py
flutter pub get
flutter clean
flutter build apk --release

echo "Nuur Path APK built with the custom launcher icon."
echo "Output: build/app/outputs/flutter-apk/app-release.apk"
