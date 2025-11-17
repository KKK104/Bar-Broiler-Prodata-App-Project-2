@echo off
echo ========================================
echo    Supabase Connection Fix Script
echo ========================================
echo.

echo Checking current environment...
if exist .env.local (
    echo ✅ .env.local file found
) else (
    echo ❌ .env.local file not found
    echo Please create .env.local with your Supabase credentials
    pause
    exit /b 1
)

echo.
echo Testing network connectivity...
ping -n 1 8.8.8.8 >nul
if %errorlevel% equ 0 (
    echo ✅ Internet connection working
) else (
    echo ❌ Internet connection failed
    pause
    exit /b 1
)

echo.
echo Testing Supabase domain resolution...
nslookup yusqlnqtsszjjmmyqaibp.supabase.co >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Supabase domain resolves
) else (
    echo ❌ Supabase domain cannot be resolved
    echo.
    echo This means your Supabase project may be:
    echo - Deleted
    echo - Paused
    echo - Suspended
    echo.
    echo Please check your Supabase dashboard:
    echo https://supabase.com/dashboard
    echo.
    echo After fixing the project, run this script again.
    pause
    exit /b 1
)

echo.
echo Testing Supabase connection...
node test-supabase-connection.js
if %errorlevel% equ 0 (
    echo ✅ Supabase connection successful!
    echo.
    echo Your app should now work without "failed to fetch" errors.
    echo.
    echo To restart your development server:
    echo npm run dev
    echo.
    echo To rebuild your mobile app:
    echo npm run build:mobile:win
) else (
    echo ❌ Supabase connection failed
    echo.
    echo Please check:
    echo 1. Your Supabase project is active
    echo 2. Your credentials are correct
    echo 3. Your network allows HTTPS connections
    echo.
    echo See SUPABASE_SETUP_GUIDE.md for detailed instructions.
)

echo.
pause






