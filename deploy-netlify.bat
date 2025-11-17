@echo off
echo Starting Netlify deployment...

echo Building the project...
call npm run build

echo Build completed successfully!
echo.
echo Next steps:
echo 1. Go to your Netlify dashboard
echo 2. Drag and drop the 'out' folder to deploy
echo 3. Or connect your GitHub repository for automatic deployments
echo.
echo Your site will be available at: https://friendly-conkies-db6509.netlify.app
echo.
pause 