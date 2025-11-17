@echo off
echo ========================================
echo Bar Broiler Prodata App - Redeploy with Fixes
echo ========================================
echo.

echo Step 1: Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b 1
)
echo ✅ Build completed successfully!
echo.

echo Step 2: Deploying to Netlify...
call netlify deploy --prod --dir=out
if %errorlevel% neq 0 (
    echo ❌ Deployment failed! Please check the errors above.
    pause
    exit /b 1
)
echo ✅ Deployment completed successfully!
echo.

echo Step 3: Database fixes required...
echo.
echo IMPORTANT: You need to run the database fix script in Supabase:
echo 1. Go to your Supabase dashboard
echo 2. Open the SQL Editor
echo 3. Copy and paste the contents of 'comprehensive_database_fix.sql'
echo 4. Run the script
echo.
echo This will fix all foreign key constraint issues.
echo.

echo Step 4: Testing the application...
echo Please test the following features:
echo - Adding participants (should work without foreign key errors)
echo - Adding buildings (should work without foreign key errors)
echo - Calculator sessions (should work without 409/406 errors)
echo.

echo ========================================
echo Redeployment completed!
echo ========================================
echo.
echo Your app is now live at: https://bar-broiler-prodata-app.netlify.app/
echo.
echo Remember to run the database fix script in Supabase!
echo.
pause
