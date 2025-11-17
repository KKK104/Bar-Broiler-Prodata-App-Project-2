-- Performance Calculations Table
-- Run this in your Supabase SQL Editor to create the performance_calculations table

CREATE TABLE IF NOT EXISTS performance_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  calculation_type TEXT NOT NULL CHECK (calculation_type IN ('alw', 'adg', 'fcr')),
  calculation_data JSONB NOT NULL DEFAULT '{}',
  result_value NUMERIC(10,4) NOT NULL DEFAULT 0,
  calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_calculations_farm_id ON performance_calculations(farm_id);
CREATE INDEX IF NOT EXISTS idx_performance_calculations_building_id ON performance_calculations(building_id);
CREATE INDEX IF NOT EXISTS idx_performance_calculations_type ON performance_calculations(calculation_type);
CREATE INDEX IF NOT EXISTS idx_performance_calculations_date ON performance_calculations(calculation_date);

-- Add comments to document the table
COMMENT ON TABLE performance_calculations IS 'Stores performance calculation results (ALW, ADG, FCR) for each building';
COMMENT ON COLUMN performance_calculations.calculation_type IS 'Type of calculation: alw, adg, or fcr';
COMMENT ON COLUMN performance_calculations.calculation_data IS 'JSON data containing the input parameters used for the calculation';
COMMENT ON COLUMN performance_calculations.result_value IS 'The calculated result value';

