# Online APK Deployment Guide - Fix "Failed to Fetch"

## 🚨 Current Issue
- Supabase connection failing due to incorrect project ID and API key
- Need to generate new APK with fixed connection
- Deploy APK online for access from any WiFi network

## 🔧 Step 1: Fix Supabase Credentials

### Get Correct Credentials from Dashboard:
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/yusqlnqtsszjjmyqaibp
2. Click **Settings** → **API** in the left sidebar
3. Copy the correct credentials:

```
Project URL: https://yusqlnqtsszjjmyqaibp.supabase.co
anon/public key: [your-actual-anon-key]
```

### Update Environment Variables:
1. Open `.env.local` file
2. Replace the credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://yusqlnqtsszjjmyqaibp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[paste-your-actual-anon-key-here]
```

## 🔧 Step 2: Generate New APK

### Build the App:
```bash
# Build for mobile with fixed connection
npm run build:mobile:win

# Build Android APK
cd android
.\gradlew assembleDebug
```

### Copy APK to root directory:
```bash
# From android directory
Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "..\PRODATA-BROILER-APP-FIXED.apk"
```

## 🌐 Step 3: Deploy APK Online

### Option A: GitHub Releases (Recommended)
1. Create GitHub repository
2. Upload APK to Releases
3. Get direct download link

### Option B: Google Drive
1. Upload APK to Google Drive
2. Set sharing to "Anyone with link"
3. Get direct download link

### Option C: Firebase App Distribution
1. Set up Firebase project
2. Upload APK to Firebase App Distribution
3. Get download link

### Option D: Netlify/Vercel (Static Hosting)
1. Create simple HTML page with download link
2. Deploy to Netlify/Vercel
3. Host APK file alongside

## 🚀 Quick Deployment Script

Create `deploy-apk-online.bat`:
```batch
@echo off
echo ========================================
echo    Online APK Deployment Script
echo ========================================

echo Step 1: Building new APK...
npm run build:mobile:win
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo Step 2: Building Android APK...
cd android
.\gradlew assembleDebug
if %errorlevel% neq 0 (
    echo ❌ Android build failed
    pause
    exit /b 1
)

echo Step 3: Copying APK...
Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "..\PRODATA-BROILER-APP-ONLINE.apk"
cd ..

echo Step 4: Creating download page...
echo ^<!DOCTYPE html^> > apk-download.html
echo ^<html^> >> apk-download.html
echo ^<head^>^<title^>PRODATA Broiler App Download^</title^>^</head^> >> apk-download.html
echo ^<body^> >> apk-download.html
echo ^<h1^>PRODATA Broiler App^</h1^> >> apk-download.html
echo ^<p^>Download the latest version of the farm management app:^</p^> >> apk-download.html
echo ^<a href="PRODATA-BROILER-APP-ONLINE.apk"^>Download APK^</a^> >> apk-download.html
echo ^</body^>^</html^> >> apk-download.html

echo ✅ APK ready for online deployment!
echo 📁 Files created:
echo    - PRODATA-BROILER-APP-ONLINE.apk
echo    - apk-download.html
echo.
echo 🌐 Next steps:
echo    1. Upload both files to your hosting service
echo    2. Share the download link
echo    3. Users can download and install on any Android device
pause
```

## 📱 Installation Instructions for Users

### For End Users:
1. **Download APK** from the provided link
2. **Enable "Install from Unknown Sources"**:
   - Settings → Security → Unknown Sources
   - Or Settings → Apps → Special app access → Install unknown apps
3. **Install APK** by tapping on the downloaded file
4. **Open App** and start using

### App Features:
- ✅ Works on any WiFi network
- ✅ No internet required for basic functions
- ✅ Syncs data when connected
- ✅ Farm management tools
- ✅ Performance tracking
- ✅ Participant management

## 🔍 Troubleshooting

### If APK won't install:
- Check Android version (requires API 23+)
- Enable "Install from Unknown Sources"
- Try downloading again

### If app shows "Failed to fetch":
- Check WiFi connection
- Verify Supabase credentials are correct
- Restart the app

### For Developers:
- Test connection: `node test-correct-supabase.js`
- Check logs: `adb logcat` (if device connected)
- Rebuild if needed: `npm run build:mobile:win`

## 🌟 Benefits of Online Deployment

1. **Universal Access**: Works on any WiFi network
2. **Easy Updates**: Upload new APK to same location
3. **No App Store**: Direct distribution
4. **Offline Capable**: Core functions work without internet
5. **Real-time Sync**: Data syncs when connected






