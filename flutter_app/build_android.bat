@echo off
setlocal

flutter create . --platforms android
if errorlevel 1 exit /b 1

python tool\prepare_android_branding.py
if errorlevel 1 exit /b 1

flutter pub get
if errorlevel 1 exit /b 1

flutter clean
flutter build apk --release
if errorlevel 1 exit /b 1

echo.
echo Nuur Path APK built with the custom launcher icon.
echo Output: build\app\outputs\flutter-apk\app-release.apk
endlocal
