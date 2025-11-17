@echo off
echo ========================================
echo   Netlify Deployment Fix Script
echo ========================================
echo.

echo This script will help you fix the "Failed to fetch" error
echo by setting up the required environment variables.
echo.

echo Step 1: Generate password hash for 'leo123'
echo Running: node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('leo123', 10));"
echo.

node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('leo123', 10));"

echo.
echo ========================================
echo   NEXT STEPS:
echo ========================================
echo.
echo 1. Copy the password hash above
echo 2. Go to: https://app.netlify.com/sites/friendly-conkies-db6509/settings/environment
echo 3. Add these environment variables:
echo.
echo    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
echo    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
echo    DEVELOPER_EMAIL=leonacinintal@gmail.com
echo    DEVELOPER_PASSWORD_HASH=[paste-hash-from-above]
echo    JWT_SECRET=your-super-secret-jwt-key-change-in-production
echo.
echo 4. Go to Deploys tab and click "Trigger deploy"
echo 5. Wait for deployment to complete
echo 6. Test your login at: https://friendly-conkies-db6509.netlify.app
echo.
echo ========================================
echo   TROUBLESHOOTING:
echo ========================================
echo.
echo If you still get errors:
echo - Check Supabase project is active
echo - Verify you're using the ANON key (not service role)
echo - Ensure CORS is configured for Netlify domain
echo - Check function logs in Netlify dashboard
echo.
pause
