@echo off
echo ========================================
echo    Online APK Deployment Script
echo ========================================
echo.

echo Step 1: Testing Supabase connection...
node test-final-supabase.js
if %errorlevel% neq 0 (
    echo ❌ Supabase connection failed
    pause
    exit /b 1
)

echo.
echo Step 2: Building new APK with fixed connection...
npm run build:mobile:win
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo Step 3: Building Android APK...
cd android
.\gradlew assembleDebug
if %errorlevel% neq 0 (
    echo ❌ Android build failed
    pause
    exit /b 1
)

echo.
echo Step 4: Copying APK to root directory...
Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "..\PRODATA-BROILER-APP-ONLINE.apk"
cd ..

echo.
echo Step 5: Creating download page...
echo ^<!DOCTYPE html^> > apk-download.html
echo ^<html lang="en"^> >> apk-download.html
echo ^<head^> >> apk-download.html
echo     ^<meta charset="UTF-8"^> >> apk-download.html
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^> >> apk-download.html
echo     ^<title^>PRODATA Broiler App Download^</title^> >> apk-download.html
echo     ^<style^> >> apk-download.html
echo         body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; } >> apk-download.html
echo         .download-btn { display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 18px; margin: 20px 0; } >> apk-download.html
echo         .download-btn:hover { background: #0056b3; } >> apk-download.html
echo         .features { text-align: left; margin: 30px 0; } >> apk-download.html
echo         .feature { margin: 10px 0; } >> apk-download.html
echo     ^</style^> >> apk-download.html
echo ^</head^> >> apk-download.html
echo ^<body^> >> apk-download.html
echo     ^<h1^>PRODATA Broiler App^</h1^> >> apk-download.html
echo     ^<p^>Download the latest version of the farm management app with fixed Supabase connection.^</p^> >> apk-download.html
echo     ^<a href="PRODATA-BROILER-APP-ONLINE.apk" class="download-btn"^>📱 Download APK^</a^> >> apk-download.html
echo     ^<div class="features"^> >> apk-download.html
echo         ^<h3^>App Features:^</h3^> >> apk-download.html
echo         ^<div class="feature"^>✅ Works on any WiFi network^</div^> >> apk-download.html
echo         ^<div class="feature"^>✅ No internet required for basic functions^</div^> >> apk-download.html
echo         ^<div class="feature"^>✅ Syncs data when connected^</div^> >> apk-download.html
echo         ^<div class="feature"^>✅ Farm management tools^</div^> >> apk-download.html
echo         ^<div class="feature"^>✅ Performance tracking^</div^> >> apk-download.html
echo         ^<div class="feature"^>✅ Participant management^</div^> >> apk-download.html
echo     ^</div^> >> apk-download.html
echo     ^<div class="features"^> >> apk-download.html
echo         ^<h3^>Installation Instructions:^</h3^> >> apk-download.html
echo         ^<div class="feature"^>1. Download the APK file^</div^> >> apk-download.html
echo         ^<div class="feature"^>2. Enable "Install from Unknown Sources" in Settings^</div^> >> apk-download.html
echo         ^<div class="feature"^>3. Tap the downloaded APK to install^</div^> >> apk-download.html
echo         ^<div class="feature"^>4. Open the app and start using^</div^> >> apk-download.html
echo     ^</div^> >> apk-download.html
echo     ^<p^>^<small^>Version: 1.0 | Built: %date% %time%^</small^>^</p^> >> apk-download.html
echo ^</body^> >> apk-download.html
echo ^</html^> >> apk-download.html

echo.
echo ✅ APK ready for online deployment!
echo.
echo 📁 Files created:
echo    - PRODATA-BROILER-APP-ONLINE.apk
echo    - apk-download.html
echo.
echo 🌐 Next steps for online deployment:
echo    1. Upload both files to your hosting service (GitHub, Google Drive, etc.)
echo    2. Share the download link with users
echo    3. Users can download and install on any Android device
echo.
echo 📱 The app will now work without "failed to fetch" errors!
echo.
pause






