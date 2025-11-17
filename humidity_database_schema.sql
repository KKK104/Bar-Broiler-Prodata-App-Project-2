-- ============================================
-- HUMIDITY FEATURE DATABASE SCHEMA
-- ============================================

-- Create humidity_settings table for storing user humidity preferences
CREATE TABLE IF NOT EXISTS humidity_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    city TEXT,
    country TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    update_frequency_minutes INTEGER DEFAULT 15,
    last_updated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create humidity_data table for storing fetched humidity data
CREATE TABLE IF NOT EXISTS humidity_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    humidity_setting_id UUID REFERENCES humidity_settings(id) ON DELETE CASCADE,
    humidity_percentage DECIMAL(5, 2) NOT NULL,
    temperature_celsius DECIMAL(5, 2),
    feels_like_celsius DECIMAL(5, 2),
    weather_description TEXT,
    api_provider TEXT DEFAULT 'openweathermap',
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_humidity_settings_user_id ON humidity_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_humidity_settings_farm_id ON humidity_settings(farm_id);
CREATE INDEX IF NOT EXISTS idx_humidity_settings_is_enabled ON humidity_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_humidity_data_setting_id ON humidity_data(humidity_setting_id);
CREATE INDEX IF NOT EXISTS idx_humidity_data_fetched_at ON humidity_data(fetched_at DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_humidity_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for humidity_settings
CREATE TRIGGER update_humidity_settings_updated_at 
    BEFORE UPDATE ON humidity_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_humidity_settings_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE humidity_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE humidity_data ENABLE ROW LEVEL SECURITY;

-- Create policies for humidity_settings table
-- Users can view their own humidity settings
CREATE POLICY "Users can view their own humidity settings" ON humidity_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own humidity settings
CREATE POLICY "Users can insert their own humidity settings" ON humidity_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own humidity settings
CREATE POLICY "Users can update their own humidity settings" ON humidity_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own humidity settings
CREATE POLICY "Users can delete their own humidity settings" ON humidity_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for humidity_data table
-- Users can view humidity data for their settings
CREATE POLICY "Users can view their humidity data" ON humidity_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM humidity_settings 
            WHERE id = humidity_data.humidity_setting_id 
            AND user_id = auth.uid()
        )
    );

-- Users can insert humidity data for their settings
CREATE POLICY "Users can insert their humidity data" ON humidity_data
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM humidity_settings 
            WHERE id = humidity_data.humidity_setting_id 
            AND user_id = auth.uid()
        )
    );

-- Add comments to document the tables
COMMENT ON TABLE humidity_settings IS 'Stores user humidity monitoring preferences and location settings';
COMMENT ON TABLE humidity_data IS 'Stores fetched humidity data from weather APIs';
COMMENT ON COLUMN humidity_settings.location_name IS 'User-friendly name for the location (e.g., "Main Farm", "Building A")';
COMMENT ON COLUMN humidity_settings.latitude IS 'Latitude coordinate for weather API calls';
COMMENT ON COLUMN humidity_settings.longitude IS 'Longitude coordinate for weather API calls';
COMMENT ON COLUMN humidity_settings.update_frequency_minutes IS 'How often to fetch new humidity data (in minutes)';
COMMENT ON COLUMN humidity_data.humidity_percentage IS 'Humidity percentage from weather API';
COMMENT ON COLUMN humidity_data.temperature_celsius IS 'Temperature in Celsius from weather API';
COMMENT ON COLUMN humidity_data.feels_like_celsius IS 'Feels-like temperature in Celsius from weather API';
