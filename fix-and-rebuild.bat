@echo off
echo ========================================
echo    Fix Environment & Rebuild APK
echo ========================================
echo.

echo Step 1: Backing up current .env.local...
if exist .env.local (
    copy .env.local .env.local.backup
    echo ✅ Backup created: .env.local.backup
)

echo.
echo Step 2: Creating corrected .env.local...
(
echo # Supabase Configuration - FIXED VERSION
echo NEXT_PUBLIC_SUPABASE_URL=https://yusqlnqtsszjjmyqaibp.supabase.co
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1c3FsbnF0c3N6ampteXFhaWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMzk5MjMsImV4cCI6MjA2NzYxNTkyM30.RTBBNk_SXYQBAMf9q0AfR5VkrGCw9IvAtLcLG1YtC88
echo.
echo # Developer Authentication ^(for local development^)
echo DEVELOPER_EMAIL=leonacinintal@gmail.com
echo DEVELOPER_PASSWORD_HASH=$2a$10$your-hashed-password-here
echo.
echo # JWT Secret ^(for local development^)
echo JWT_SECRET=a58494d9436811628179d591b3d8dcad2ebf12d8c5f933f78ebb8262e3a4faa3e11f4eb0911ab2d33d124d981d6d069183f2182afd113fa7ef5bf7da7d5325b9
) > .env.local

echo ✅ Environment file updated with correct Supabase URL

echo.
echo Step 3: Testing Supabase connection...
node test-final-supabase.js
if %errorlevel% neq 0 (
    echo ❌ Supabase connection failed
    echo Restoring backup...
    copy .env.local.backup .env.local
    pause
    exit /b 1
)

echo.
echo Step 4: Building new APK with fixed connection...
npm run build:mobile:win
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo Step 5: Building Android APK...
cd android
.\gradlew assembleDebug
if %errorlevel% neq 0 (
    echo ❌ Android build failed
    pause
    exit /b 1
)

echo.
echo Step 6: Creating final APK...
Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "..\PRODATA-BROILER-APP-FIXED-FINAL.apk"
cd ..

echo.
echo ✅ APK rebuilt successfully!
echo 📁 New APK: PRODATA-BROILER-APP-FIXED-FINAL.apk
echo.
echo 🌐 Next steps:
echo    1. Upload the new APK to your Netlify site
echo    2. Replace the old APK file
echo    3. Test the app - should work without "failed to fetch"
echo.
pause






