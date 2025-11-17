@echo off
echo Building and deploying with cache busting...

REM Clean previous build
echo Cleaning previous build...
if exist "out" rmdir /s /q "out"
if exist ".next" rmdir /s /q ".next"

REM Install dependencies
echo Installing dependencies...
npm install

REM Build the project
echo Building project...
npm run build

REM Deploy to Netlify with cache busting
echo Deploying to Netlify...
netlify deploy --prod --dir=out --message="Deploy with cache busting - %date% %time%"

echo Deployment complete!
echo Please clear your browser cache or use Ctrl+F5 to force refresh
pause
