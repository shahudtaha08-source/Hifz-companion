@echo off
setlocal

flutter create . --platforms android
if errorlevel 1 exit /b 1

bash tool/prepare_quran_assets.sh
if errorlevel 1 exit /b 1

python tool\prepare_android_branding.py
if errorlevel 1 exit /b 1

flutter pub get
if errorlevel 1 exit /b 1

flutter clean
flutter build apk --release
if errorlevel 1 exit /b 1

echo.
echo Miqra APK built with bundled offline Quran data.
echo Output: build\app\outputs\flutter-apk\app-release.apk
endlocal
