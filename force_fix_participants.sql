-- Create calculator_sessions table to fix 406 errors
-- This is the main issue causing the API errors

CREATE TABLE IF NOT EXISTS calculator_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    session_name TEXT,
    farm_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for calculator_sessions
CREATE INDEX IF NOT EXISTS idx_calculator_sessions_farm_id ON calculator_sessions(farm_id);
CREATE INDEX IF NOT EXISTS idx_calculator_sessions_building_id ON calculator_sessions(building_id);
CREATE INDEX IF NOT EXISTS idx_calculator_sessions_active ON calculator_sessions(is_active);

-- Grant permissions on calculator_sessions
GRANT ALL ON calculator_sessions TO authenticated;

-- Show success message
SELECT 'Calculator sessions table created successfully!' as status;
