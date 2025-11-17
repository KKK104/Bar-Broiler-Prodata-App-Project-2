@echo off
echo 🚀 Starting Public Deployment...
echo.

echo 📦 Building the project...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo ✅ Build successful!

echo.
echo 🌐 Deploying to Vercel...
echo Please follow the prompts in the terminal:
echo 1. Login to Vercel (if needed)
echo 2. Choose your account
echo 3. Set project name: farm-management-app
echo 4. Choose directory: ./
echo.

vercel

echo.
echo 🎉 Deployment completed!
echo.
echo 📱 Your app is now publicly accessible!
echo 🌍 Web: https://your-app.vercel.app
echo 🔧 Developer Feedback: https://your-app.vercel.app/developer-feedback
echo.
echo 📋 Next steps:
echo 1. Update APK configuration with the new public URL
echo 2. Test the web app from any device
echo 3. Rebuild APK with new server URL
echo.
pause 