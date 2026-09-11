@echo off
echo ====================================================
echo   🏎️ TURBO RACER 3D - Android APK Build Script
echo ====================================================
echo.

echo [1/3] Installing Dependencies...
call npm install
call npm install @capacitor/core @capacitor/cli @capacitor/android --save

echo.
echo [2/3] Adding Android Platform & Syncing...
if not exist "android" (
    call npx cap add android
)
call npx cap sync

echo.
echo [3/3] Opening Project in Android Studio...
echo In Android Studio: Click [Build] -> [Build Bundle(s) / APK(s)] -> [Build APK(s)]
call npx cap open android

echo.
echo ====================================================
echo   Android Studio Opened Successfully!
echo ====================================================
pause
