@echo off
echo ========================================
echo Fixing Add Building and Add Participant Issues
echo ========================================

echo.
echo 1. Checking environment variables...
if "%NEXT_PUBLIC_SUPABASE_URL%"=="" (
    echo ❌ NEXT_PUBLIC_SUPABASE_URL is not set
    echo Please set this in your Netlify environment variables
) else (
    echo ✅ NEXT_PUBLIC_SUPABASE_URL is set
)

if "%NEXT_PUBLIC_SUPABASE_ANON_KEY%"=="" (
    echo ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set
    echo Please set this in your Netlify environment variables
) else (
    echo ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set
)

echo.
echo 2. Building the project...
call npm run build

echo.
echo 3. Deploying to Netlify...
call netlify deploy --prod

echo.
echo ========================================
echo Fix Summary:
echo ========================================
echo ✅ Temporarily disabled email verification blocking
echo ✅ Added better error handling and debugging
echo ✅ Added debug panel to help troubleshoot issues
echo ✅ Enhanced logging for add building/participant functions
echo.
echo Next Steps:
echo 1. Check the debug panel in the top-right corner
echo 2. Use "Test Add Building" and "Test Add Participant" buttons
echo 3. Check browser console for detailed error messages
echo 4. Ensure Supabase environment variables are set in Netlify
echo.
echo If issues persist:
echo - Check browser console for specific error messages
echo - Verify Supabase project is active and accessible
echo - Ensure database tables (farms, buildings, participants) exist
echo - Check CORS settings in Supabase dashboard
echo ========================================

pause
