-- Database Migration: Add cycle tracking columns to buildings table
-- Run this in your Supabase SQL Editor

-- Add cycle_number column (optional integer)
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS cycle_number INTEGER DEFAULT 1;

-- Add cycle_start_date column (optional date)
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS cycle_start_date DATE DEFAULT CURRENT_DATE;

-- Add comments to document the new columns
COMMENT ON COLUMN buildings.cycle_number IS 'The current cycle number for this building (e.g., 1, 2, 3...)';
COMMENT ON COLUMN buildings.cycle_start_date IS 'The start date of the current cycle for this building';

-- Update existing buildings to have default values if they don't have them
UPDATE buildings 
SET 
  cycle_number = COALESCE(cycle_number, 1),
  cycle_start_date = COALESCE(cycle_start_date, CURRENT_DATE)
WHERE cycle_number IS NULL OR cycle_start_date IS NULL;

-- Create calculator_sessions table for storing farm setup data
CREATE TABLE IF NOT EXISTS calculator_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  farm_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing daily_records table if it exists (to recreate with correct schema)
DROP TABLE IF EXISTS daily_records;

-- Create daily_records table for storing daily tracking data
CREATE TABLE daily_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  age INTEGER NOT NULL,
  daily_feeds NUMERIC(10,2) DEFAULT 0,
  cumulative_feeds NUMERIC(10,2) DEFAULT 0,
  feeds_delivery NUMERIC(10,2) DEFAULT 0,
  remaining_feeds NUMERIC(10,2) DEFAULT 0,
  daily_mortality INTEGER DEFAULT 0,
  cumulative_mortality INTEGER DEFAULT 0,
  mortality_percent NUMERIC(5,2) DEFAULT 0,
  ending_heads INTEGER DEFAULT 0,
  alw NUMERIC(8,2) DEFAULT 0,
  adg NUMERIC(8,2) DEFAULT 0,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(building_id, date)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calculator_sessions_farm_id ON calculator_sessions(farm_id);
CREATE INDEX IF NOT EXISTS idx_calculator_sessions_building_id ON calculator_sessions(building_id);
CREATE INDEX IF NOT EXISTS idx_calculator_sessions_active ON calculator_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_records_farm_id ON daily_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_building_id ON daily_records(building_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date);

-- Add comments to document the new tables
COMMENT ON TABLE calculator_sessions IS 'Stores farm setup data and calculator sessions for each farm';
COMMENT ON TABLE daily_records IS 'Stores daily tracking records for each building'; 