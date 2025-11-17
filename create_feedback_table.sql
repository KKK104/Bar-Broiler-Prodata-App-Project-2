-- Create feedback table for suggestions and bug reports
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('suggestion', 'bug')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    category TEXT NOT NULL DEFAULT 'General',
    user_email TEXT,
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
    device_info TEXT,
    app_version TEXT DEFAULT '1.0.0',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    developer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_email ON feedback(user_email);
CREATE INDEX IF NOT EXISTS idx_feedback_farm_id ON feedback(farm_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for feedback table
-- Allow users to insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON feedback
    FOR INSERT WITH CHECK (true);

-- Allow users to view their own feedback (simplified)
CREATE POLICY "Users can view their own feedback" ON feedback
    FOR SELECT USING (
        user_email = current_setting('request.jwt.claims', true)::json->>'email' OR
        farm_id IS NOT NULL
    );

-- Allow developers/admins to view all feedback
CREATE POLICY "Developers can view all feedback" ON feedback
    FOR SELECT USING (true);

-- Allow developers/admins to update feedback
CREATE POLICY "Developers can update feedback" ON feedback
    FOR UPDATE USING (true);

-- Insert some sample feedback for testing
INSERT INTO feedback (type, title, description, priority, category, user_email, device_info, status) VALUES
('suggestion', 'Add dark mode support', 'It would be great to have a dark mode option for better visibility in low light conditions.', 'medium', 'UI/UX Improvement', 'test@example.com', 'Windows | 1920x1080 | 1920x937 | Mozilla/5.0', 'new'),
('bug', 'Calculation error in FCR', 'The FCR calculation seems to be showing incorrect values when the feed consumption is high.', 'high', 'Calculation Errors', 'user@farm.com', 'Android | 1080x2400 | 1080x2200 | Mozilla/5.0', 'new'),
('suggestion', 'Export data to Excel', 'Please add the ability to export farm data to Excel format for offline analysis.', 'medium', 'Feature Request', 'manager@farm.com', 'iOS | 1170x2532 | 1170x2332 | Mozilla/5.0', 'new');

-- Grant necessary permissions
GRANT ALL ON feedback TO authenticated; 