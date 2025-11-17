@echo off
echo Building Farm Management App APK...
echo.

echo Step 1: Building Next.js app...
call npm run build:mobile:win

echo.
echo Step 2: Building Android APK...
cd android
call gradlew assembleDebug

echo.
echo APK should be generated at: android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause 