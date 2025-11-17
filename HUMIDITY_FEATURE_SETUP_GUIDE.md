# Humidity Monitoring Feature Setup Guide

This guide will help you set up the humidity monitoring feature for your broiler production app.

## 🎯 Feature Overview

The humidity monitoring feature allows users to:
- Set up location-based humidity monitoring for their farms
- View real-time humidity data and recommendations
- Manage humidity settings (enable/disable/delete)
- Receive automatic updates every 15 minutes
- Persist settings across sessions

## 📋 Prerequisites

1. **Database Setup**: Run the humidity database schema
2. **Weather API Keys**: Get API keys from weather services
3. **Environment Variables**: Configure API keys and secrets
4. **Cron Job Setup**: Configure automatic data updates

## 🗄️ Database Setup

### Step 1: Run the Database Schema

Execute the SQL script in your Supabase SQL Editor:

```sql
-- Run the contents of humidity_database_schema.sql
-- This creates the humidity_settings and humidity_data tables
```

### Step 2: Verify Tables Created

Check that the following tables exist:
- `humidity_settings` - Stores user location preferences
- `humidity_data` - Stores fetched humidity data

## 🔑 Weather API Configuration

### Step 1: Get API Keys

#### OpenWeatherMap (Recommended)
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier: 1,000 calls/day, 60 calls/minute

#### WeatherAPI (Backup)
1. Go to [WeatherAPI](https://www.weatherapi.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier: 1 million calls/month

### Step 2: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Weather API Keys
NEXT_PUBLIC_OPENWEATHER_API_KEY=your-openweathermap-api-key-here
NEXT_PUBLIC_WEATHERAPI_KEY=your-weatherapi-key-here

# Cron Job Security
CRON_SECRET=your-secure-cron-secret-here
```

## ⚙️ Automatic Updates Setup

### Option 1: Vercel Cron Jobs (Recommended)

1. **Add Vercel Cron Configuration**:
   - The `vercel-cron.json` file is already created
   - This will run every 15 minutes automatically

2. **Set Environment Variables in Vercel**:
   - Go to your Vercel project dashboard
   - Add the environment variables from Step 2 above
   - Set `CRON_SECRET` to a secure random string

### Option 2: External Cron Service

If not using Vercel, set up an external cron service:

```bash
# Example cron job (runs every 15 minutes)
*/15 * * * * curl -X POST https://your-domain.com/api/humidity/cron \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

## 🚀 Testing the Feature

### Step 1: Start the Application

```bash
npm run dev
```

### Step 2: Test Humidity Setup

1. **Login to your account**
2. **Navigate to the dashboard**
3. **Click the "Humidity" button** in the navigation bar
4. **Set up a location**:
   - Enter a location name (e.g., "Main Farm")
   - Enter latitude and longitude coordinates
   - Optionally add city and country
   - Click "Save Location"

### Step 3: Verify Data Fetching

1. **Check the humidity display** on the dashboard
2. **Click "Refresh"** to manually fetch data
3. **Verify data appears** with humidity percentage and temperature

## 🔧 Troubleshooting

### Common Issues

#### 1. "No Location Set" Error
- **Cause**: User hasn't set up humidity monitoring
- **Solution**: Click "Humidity" button and set up location

#### 2. "Failed to load humidity data"
- **Cause**: Weather API keys not configured or invalid
- **Solution**: Check environment variables and API key validity

#### 3. "All weather APIs failed"
- **Cause**: Both API keys invalid or rate limits exceeded
- **Solution**: Verify API keys and check rate limits

#### 4. Cron job not running
- **Cause**: Vercel cron not configured or external cron not set up
- **Solution**: Check Vercel cron configuration or set up external cron

### Debug Steps

1. **Check Browser Console** for client-side errors
2. **Check Server Logs** for API errors
3. **Verify Database** - check if tables exist and have data
4. **Test API Keys** - manually test weather API endpoints

## 📱 User Experience

### Dashboard Integration

The humidity feature is integrated into the main dashboard:
- **Humidity Display Card**: Shows current humidity and temperature
- **Navigation Button**: "Humidity" button in the top navigation
- **Modal Interface**: Full-featured settings and data management

### User Workflow

1. **First Time Setup**:
   - User clicks "Humidity" button
   - Sets up farm location with coordinates
   - Saves location settings

2. **Ongoing Usage**:
   - Humidity data displays automatically on dashboard
   - Users can refresh data manually
   - Users can edit/disable/delete settings

3. **Session Persistence**:
   - Settings persist across login sessions
   - Data updates automatically every 15 minutes
   - Users see same setup after logging back in

## 🎨 Customization

### Styling

The humidity components use Tailwind CSS classes and can be customized:
- Colors: Modify the color schemes in the components
- Layout: Adjust grid layouts and spacing
- Icons: Change Lucide React icons as needed

### API Configuration

You can modify the weather API service:
- Add more weather APIs
- Change update frequency
- Modify data processing logic

## 📊 Data Structure

### Humidity Settings
```typescript
interface HumiditySettings {
  id: string
  user_id: string
  farm_id: string
  location_name: string
  latitude: number
  longitude: number
  city?: string
  country?: string
  is_enabled: boolean
  update_frequency_minutes: number
  last_updated?: string
}
```

### Humidity Data
```typescript
interface HumidityData {
  id: string
  humidity_setting_id: string
  humidity_percentage: number
  temperature_celsius?: number
  feels_like_celsius?: number
  weather_description?: string
  api_provider: string
  fetched_at: string
}
```

## 🔒 Security Considerations

1. **API Key Security**: Never expose API keys in client-side code
2. **Cron Authentication**: Use secure secrets for cron job authentication
3. **Rate Limiting**: Respect weather API rate limits
4. **Data Privacy**: User location data is stored securely in database

## 📈 Performance Optimization

1. **Caching**: Weather data is cached in database
2. **Rate Limiting**: 15-minute update frequency prevents API overuse
3. **Fallback APIs**: Multiple weather APIs provide redundancy
4. **Error Handling**: Graceful degradation when APIs fail

## 🎯 Future Enhancements

Potential improvements for the humidity feature:
- Historical data charts
- Humidity alerts and notifications
- Integration with farm management systems
- Mobile app notifications
- Weather forecast integration

## 📞 Support

If you encounter issues with the humidity feature:
1. Check this setup guide
2. Verify all prerequisites are met
3. Check the troubleshooting section
4. Review the component code for customization needs

The humidity monitoring feature is now ready to help you track environmental conditions for optimal broiler production! 🐔📊
