# Supabase Setup Guide - Fix "Failed to Fetch" Error

## 🚨 Current Issue
Your app is showing "Failed to fetch" because the Supabase project `yusqlnqtsszjjmmyqaibp.supabase.co` cannot be reached.

## 🔧 Solution Steps

### Step 1: Check Current Project Status
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Log in to your account
3. Look for project `yusqlnqtsszjjmmyqaibp`
4. Check if it's:
   - ✅ **Active** - Resume if paused
   - ❌ **Deleted** - Create new project
   - ⚠️ **Suspended** - Check billing/usage

### Step 2: Create New Project (if needed)
1. Click "New Project"
2. Choose your organization
3. Enter project name: `farm-management-app`
4. Enter database password (save this!)
5. Choose region closest to you
6. Click "Create new project"

### Step 3: Get New Credentials
1. Go to Project Settings → API
2. Copy the new credentials:
   ```
   Project URL: https://[new-project-id].supabase.co
   anon/public key: [new-anon-key]
   ```

### Step 4: Update Environment Variables
1. Open `.env.local` file
2. Replace the old credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[new-project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[new-anon-key]
   ```

### Step 5: Set Up Database Schema
Run these SQL commands in your new Supabase SQL Editor:

```sql
-- Create farms table
CREATE TABLE farms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create participants table
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'worker',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buildings table
CREATE TABLE buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  building_number TEXT,
  type TEXT DEFAULT 'broiler',
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_records table
CREATE TABLE daily_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  birds_placed INTEGER,
  birds_remaining INTEGER,
  feed_consumed DECIMAL(10,2),
  mortality INTEGER DEFAULT 0,
  weight_kg DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  category TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample farm
INSERT INTO farms (name) VALUES ('Sample Farm');
```

### Step 6: Test Connection
1. Restart your development server:
   ```bash
   npm run dev
   ```
2. Open browser console (F12)
3. Check for any remaining "failed to fetch" errors

### Step 7: Alternative - Use Local Development Mode
If Supabase is still having issues, you can run the app in local development mode:

1. Update `.env.local`:
   ```env
   # Add this line
   NEXT_PUBLIC_DEVELOPMENT_MODE=true
   ```

2. The app will use local storage instead of Supabase

## 🚀 Quick Fix Commands

```bash
# Test network connectivity
ping 8.8.8.8

# Test Supabase domain
nslookup [your-project-id].supabase.co

# Restart development server
npm run dev

# Build for mobile
npm run build:mobile:win
```

## 📱 For Mobile App
After fixing Supabase, rebuild your APK:
```bash
npm run build:mobile:win
cd android
.\gradlew assembleDebug
```

## 🔍 Troubleshooting
- **DNS Issues**: Try using different DNS servers (8.8.8.8, 1.1.1.1)
- **Firewall**: Check if your firewall is blocking Supabase
- **VPN**: Disable VPN if using one
- **Corporate Network**: Check if your network blocks external APIs






