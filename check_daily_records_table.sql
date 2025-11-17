-- Check and fix daily_records table structure
-- Run this script to ensure the daily_records table has the correct structure

-- First, check if the table exists and show its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_records' 
ORDER BY ordinal_position;

-- Check if there are any constraints or indexes
SELECT 
    constraint_name, 
    constraint_type, 
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'daily_records';

-- Check if there are any foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'daily_records';

-- If the table doesn't exist or has issues, create/fix it
-- Uncomment the following lines if you need to create the table

/*
CREATE TABLE IF NOT EXISTS daily_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    age INTEGER NOT NULL,
    daily_feeds DECIMAL(10,2) DEFAULT 0,
    cumulative_feeds DECIMAL(10,2) DEFAULT 0,
    feeds_delivery DECIMAL(10,2) DEFAULT 0,
    remaining_feeds DECIMAL(10,2) DEFAULT 0,
    daily_mortality INTEGER DEFAULT 0,
    cumulative_mortality INTEGER DEFAULT 0,
    mortality_percent DECIMAL(5,2) DEFAULT 0,
    ending_heads INTEGER DEFAULT 0,
    alw DECIMAL(8,2) DEFAULT 0,
    adg DECIMAL(8,2) DEFAULT 0,
    remarks TEXT,
    mortality_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_records_building_id ON daily_records(building_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_farm_id ON daily_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date);
CREATE INDEX IF NOT EXISTS idx_daily_records_building_date ON daily_records(building_id, date);

-- Add comments to columns
COMMENT ON TABLE daily_records IS 'Daily tracking records for broiler farms';
COMMENT ON COLUMN daily_records.farm_id IS 'Reference to the farm';
COMMENT ON COLUMN daily_records.building_id IS 'Reference to the building';
COMMENT ON COLUMN daily_records.date IS 'Date of the record';
COMMENT ON COLUMN daily_records.age IS 'Age of the birds in days';
COMMENT ON COLUMN daily_records.daily_feeds IS 'Daily feed consumption in kg';
COMMENT ON COLUMN daily_records.cumulative_feeds IS 'Cumulative feed consumption in kg';
COMMENT ON COLUMN daily_records.feeds_delivery IS 'Feed delivery amount in kg';
COMMENT ON COLUMN daily_records.remaining_feeds IS 'Remaining feed amount in kg';
COMMENT ON COLUMN daily_records.daily_mortality IS 'Daily mortality count';
COMMENT ON COLUMN daily_records.cumulative_mortality IS 'Cumulative mortality count';
COMMENT ON COLUMN daily_records.mortality_percent IS 'Mortality percentage';
COMMENT ON COLUMN daily_records.ending_heads IS 'Ending head count';
COMMENT ON COLUMN daily_records.alw IS 'Average Live Weight in grams';
COMMENT ON COLUMN daily_records.adg IS 'Average Daily Gain in grams';
COMMENT ON COLUMN daily_records.remarks IS 'Additional remarks or notes';
COMMENT ON COLUMN daily_records.mortality_image IS 'URL or path to mortality image';
*/
