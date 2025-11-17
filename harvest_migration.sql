-- Harvest Tables Migration
-- Run this in your Supabase SQL Editor to create the missing harvest tables

-- Create harvest_inputs table
CREATE TABLE IF NOT EXISTS harvest_inputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  plate_number TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  total_birds INTEGER NOT NULL CHECK (total_birds > 0),
  total_weight NUMERIC(10,2) NOT NULL CHECK (total_weight > 0),
  price_per_kilogram NUMERIC(10,2) NOT NULL CHECK (price_per_kilogram > 0),
  documentation_url TEXT,
  harvest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create harvest_outputs table
CREATE TABLE IF NOT EXISTS harvest_outputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  harvest_inputs JSONB NOT NULL DEFAULT '[]',
  final_alw NUMERIC(10,3) NOT NULL DEFAULT 0,
  total_revenue_per_buyer JSONB NOT NULL DEFAULT '{}',
  grand_total_revenue NUMERIC(15,2) NOT NULL DEFAULT 0,
  harvest_recovery_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_mortality INTEGER NOT NULL DEFAULT 0,
  average_mortality_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_weight NUMERIC(10,3) NOT NULL DEFAULT 0,
  adg NUMERIC(10,2) NOT NULL DEFAULT 0,
  fcr NUMERIC(10,3) NOT NULL DEFAULT 0,
  gross_income NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_income NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique output per building per cycle
  UNIQUE(building_id, cycle_number)
);

-- Create storage bucket for harvest images if it doesn't exist
DO $$
BEGIN
  -- This will be handled by the application when first upload happens
  -- Just documenting that we need a 'harvest-images' bucket
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_harvest_inputs_building_id ON harvest_inputs(building_id);
CREATE INDEX IF NOT EXISTS idx_harvest_inputs_farm_id ON harvest_inputs(farm_id);
CREATE INDEX IF NOT EXISTS idx_harvest_inputs_cycle ON harvest_inputs(cycle_number);
CREATE INDEX IF NOT EXISTS idx_harvest_inputs_date ON harvest_inputs(harvest_date);
CREATE INDEX IF NOT EXISTS idx_harvest_inputs_buyer ON harvest_inputs(buyer_name);

CREATE INDEX IF NOT EXISTS idx_harvest_outputs_building_id ON harvest_outputs(building_id);
CREATE INDEX IF NOT EXISTS idx_harvest_outputs_farm_id ON harvest_outputs(farm_id);
CREATE INDEX IF NOT EXISTS idx_harvest_outputs_cycle ON harvest_outputs(cycle_number);

-- Add comments to document the tables
COMMENT ON TABLE harvest_inputs IS 'Stores harvest input data including truck details, buyer info, and harvest metrics';
COMMENT ON TABLE harvest_outputs IS 'Stores calculated harvest performance metrics and financial summary';

COMMENT ON COLUMN harvest_inputs.plate_number IS 'Truck plate number for delivery identification';
COMMENT ON COLUMN harvest_inputs.buyer_name IS 'Name of the buyer/company purchasing the harvest';
COMMENT ON COLUMN harvest_inputs.total_birds IS 'Total number of birds in this harvest batch';
COMMENT ON COLUMN harvest_inputs.total_weight IS 'Total weight of birds in kilograms';
COMMENT ON COLUMN harvest_inputs.price_per_kilogram IS 'Price per kilogram in local currency';
COMMENT ON COLUMN harvest_inputs.documentation_url IS 'URL to uploaded truck photos or documentation';

COMMENT ON COLUMN harvest_outputs.harvest_inputs IS 'JSON array of all harvest inputs for this building/cycle';
COMMENT ON COLUMN harvest_outputs.final_alw IS 'Final Average Live Weight in kilograms';
COMMENT ON COLUMN harvest_outputs.total_revenue_per_buyer IS 'JSON object with buyer names and their total revenue';
COMMENT ON COLUMN harvest_outputs.grand_total_revenue IS 'Total revenue from all buyers';
COMMENT ON COLUMN harvest_outputs.harvest_recovery_percent IS 'Percentage of birds successfully harvested';
COMMENT ON COLUMN harvest_outputs.adg IS 'Average Daily Gain in grams per day';
COMMENT ON COLUMN harvest_outputs.fcr IS 'Feed Conversion Ratio';
COMMENT ON COLUMN harvest_outputs.gross_income IS 'Total income before expenses';
COMMENT ON COLUMN harvest_outputs.net_income IS 'Net income after deducting costs';

-- Enable Row Level Security (RLS)
ALTER TABLE harvest_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvest_outputs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your authentication setup)
-- Users can only access harvest data for their own farms
CREATE POLICY "Users can view their own harvest inputs" ON harvest_inputs
  FOR SELECT USING (
    farm_id IN (
      SELECT id FROM farms WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own harvest inputs" ON harvest_inputs
  FOR INSERT WITH CHECK (
    farm_id IN (
      SELECT id FROM farms WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own harvest inputs" ON harvest_inputs
  FOR UPDATE USING (
    farm_id IN (
      SELECT id FROM farms WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own harvest inputs" ON harvest_inputs
  FOR DELETE USING (
    farm_id IN (
      SELECT id FROM farms WHERE user_id = auth.uid()
    )
  );

-- Similar policies for harvest_outputs
CREATE POLICY "Users can view their own harvest outputs" ON harvest_outputs
  FOR SELECT USING (
    farm_id IN (
      SELECT id FROM farms WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own harvest outputs" ON harvest_outputs
  FOR INSERT WITH CHECK (
    farm_id IN (
      SELECT id FROM farms WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own harvest outputs" ON harvest_outputs
  FOR UPDATE USING (
    farm_id IN (
      SELECT id FROM farms WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own harvest outputs" ON harvest_outputs
  FOR DELETE USING (
    farm_id IN (
      SELECT id FROM farms WHERE user_id = auth.uid()
    )
  );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_harvest_inputs_updated_at BEFORE UPDATE ON harvest_inputs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_harvest_outputs_updated_at BEFORE UPDATE ON harvest_outputs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created successfully
SELECT 'harvest_inputs table created' as status, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'harvest_inputs') as exists;

SELECT 'harvest_outputs table created' as status,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'harvest_outputs') as exists; 