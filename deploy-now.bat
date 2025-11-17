@echo off
echo ========================================
echo Building and Deploying to Netlify
echo ========================================

echo.
echo 1. Building the application...
npm run build

if %ERRORLEVEL% NEQ 0 (
    echo Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo 2. Deploying to Netlify...
netlify deploy --prod --dir=out --message="Deploy with cache busting - %date% %time%"

if %ERRORLEVEL% NEQ 0 (
    echo Deployment failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment Successful!
echo ========================================
echo.
echo To see your changes:
echo 1. Clear your browser cache (Ctrl+Shift+Delete)
echo 2. Or use Ctrl+F5 to force refresh
echo 3. Or open in an incognito/private window
echo.
echo Your app is live at: https://bar-broiler-prodata-app.netlify.app/
echo.
pause
