@echo off
echo ========================================
echo QUICK FIX - Deploying to Netlify
echo ========================================

echo.
echo 🚀 Building project...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo 🚀 Deploying to Netlify...
call netlify deploy --prod --dir=out

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ QUICK FIX DEPLOYED!
echo ========================================
echo.
echo Changes made:
echo ✅ Removed email verification blocking from dashboard
echo ✅ Add building and add participant should now work
echo.
echo Test the functionality:
echo 1. Visit: https://bar-broiler-prodata-app.netlify.app/
echo 2. Sign in with your account
echo 3. Try adding buildings and participants
echo 4. Use the debug panel in top-right corner
echo.
echo ========================================

pause
