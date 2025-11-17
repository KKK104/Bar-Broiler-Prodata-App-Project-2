# 🗺️ Map Picker Setup Guide

## Overview
The humidity feature now includes an interactive map picker that allows users to visually select their farm location using Google Maps.

## ✅ Features Added

### 🎯 **Map Picker Component**
- **Interactive Google Maps**: Click to select location
- **Search Integration**: Search for addresses and landmarks
- **Current Location**: GPS-based location detection
- **Drag & Drop**: Move marker to fine-tune location
- **Reverse Geocoding**: Automatically get address from coordinates

### 🎨 **Enhanced Location Picker Modal**
- **Tabbed Interface**: Switch between "Search" and "Map" methods
- **Visual Selection**: See exactly where you're selecting
- **Better UX**: More intuitive location selection process

## 🔧 Setup Requirements

### 1. **Google Maps API Key**
You need a Google Maps API key to use the map picker:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select existing one
3. **Enable APIs**:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. **Create credentials** → API Key
5. **Restrict the key** (recommended for production)

### 2. **Environment Variables**
Add to your `.env.local` file:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### 3. **API Key Restrictions** (Recommended)
For security, restrict your API key to:
- **HTTP referrers**: Your domain (e.g., `localhost:3000/*`, `yourdomain.com/*`)
- **APIs**: Only the required APIs (Maps JavaScript, Places, Geocoding)

## 🎯 How to Use

### **For Users:**
1. **Click Humidity button** in navigation
2. **Choose selection method**:
   - **Search**: Type address or landmark
   - **Map**: Click on map to select location
3. **Fine-tune location**: Drag marker or search for specific address
4. **Save location**: Confirm and save for humidity monitoring

### **For Developers:**
1. **Get Google Maps API key** (see setup above)
2. **Add to environment variables**
3. **Test the map picker** in the humidity modal
4. **Deploy with API key** to production

## 🐛 Troubleshooting

### **Map Not Loading:**
- Check if Google Maps API key is set
- Verify API key has correct permissions
- Check browser console for errors

### **Location Not Found:**
- Try different search terms
- Use the map to click on approximate location
- Check if geocoding API is enabled

### **Permission Denied:**
- Enable location permissions in browser
- Use manual search if GPS is blocked

## 🚀 Benefits

- **Visual Selection**: See exactly where you're selecting
- **Better Accuracy**: Click on exact farm location
- **User Friendly**: Intuitive map interface
- **Fallback Options**: Search if map doesn't work
- **Mobile Optimized**: Works on all devices

## 📱 Mobile Support

The map picker is fully responsive and works on:
- **Desktop**: Full map experience
- **Tablet**: Touch-friendly interface
- **Mobile**: Optimized for small screens

## 🔒 Security Notes

- **API Key Restrictions**: Always restrict your Google Maps API key
- **Domain Whitelisting**: Only allow your domains
- **Rate Limiting**: Google Maps has usage limits
- **Cost Monitoring**: Monitor API usage in Google Cloud Console

## 🎉 Ready to Use!

Once you've added the Google Maps API key, the map picker will be available in the humidity location selection modal. Users can now visually select their farm location with precision! 🐔📊🗺️
