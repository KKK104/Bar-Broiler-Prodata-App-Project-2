# 🗺️ Google Maps API Setup Guide

## Quick Fix for the Error

The error you're seeing is because the Google Maps API key is not configured. Here's how to fix it:

### 1. **Get a Google Maps API Key**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable APIs**:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. **Create credentials** → API Key
5. **Copy the API key**

### 2. **Add to Environment Variables**

Create or update your `.env.local` file in the project root:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-actual-api-key-here
```

### 3. **Restart Development Server**

```bash
npm run dev
```

## 🔧 **Alternative: Use Search Method Only**

If you don't want to set up Google Maps right now, you can:

1. **Click the "Search" tab** in the location picker
2. **Type your location** (e.g., "New York, NY")
3. **Select from search results**

The map picker will show a helpful message and fallback to the search method.

## 🚀 **Benefits of Google Maps**

- **Visual location selection**
- **Click to select exact coordinates**
- **Better user experience**
- **More accurate location data**

## 🔒 **Security Notes**

- **Restrict your API key** to your domain
- **Monitor usage** in Google Cloud Console
- **Set up billing alerts** to avoid unexpected charges

## ✅ **Testing**

After adding the API key:

1. **Refresh your browser**
2. **Click humidity button**
3. **Switch to "Map" tab**
4. **You should see the interactive map**

The error should be resolved! 🐔📊🗺️
