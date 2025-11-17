@echo off
echo ========================================
echo   Vercel Deployment with Environment Variables
echo ========================================
echo.

echo This script will help you deploy to Vercel
echo which supports FREE environment variables!
echo.

echo Step 1: Install Vercel CLI (if not installed)
echo Running: npm install -g vercel
echo.

npm install -g vercel

echo.
echo Step 2: Login to Vercel
echo Running: vercel login
echo.

vercel login

echo.
echo Step 3: Deploy to Vercel
echo Running: vercel --prod
echo.

vercel --prod

echo.
echo ========================================
echo   NEXT STEPS:
echo ========================================
echo.
echo 1. After deployment, go to your Vercel dashboard
echo 2. Click on your project
echo 3. Go to Settings > Environment Variables
echo 4. Add these variables:
echo.
echo    NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
echo    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
echo    DEVELOPER_EMAIL=leonacinintal@gmail.com
echo    DEVELOPER_PASSWORD_HASH=$2a$10$C3UQlhshVcHJm8TN9YbOfu0QLiExHEzXeL3OX6Qk7Z0rsafOiyQRq
echo    JWT_SECRET=your-super-secret-jwt-key-change-in-production
echo.
echo 5. Redeploy your project
echo 6. Test your login!
echo.
echo ========================================
echo   BENEFITS OF VERCEL:
echo ========================================
echo.
echo ✅ Free environment variables
echo ✅ Better Next.js support
echo ✅ Faster deployments
echo ✅ No build errors
echo ✅ Automatic GitHub integration
echo.
pause 