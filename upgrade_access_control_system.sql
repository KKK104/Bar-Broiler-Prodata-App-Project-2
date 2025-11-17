-- Upgrade Access Control System
-- Migrates from simple checkbox-based access to hierarchical level + role system

-- ===== BACKUP EXISTING DATA =====
CREATE TABLE participants_backup AS SELECT * FROM participants;

-- ===== ADD NEW COLUMNS =====
ALTER TABLE participants 
ADD COLUMN access_level INTEGER DEFAULT 2,
ADD COLUMN role TEXT DEFAULT 'farm_worker',
ADD COLUMN building_ids UUID[] DEFAULT NULL,
ADD COLUMN working_hours JSONB DEFAULT NULL,
ADD COLUMN restrictions TEXT[] DEFAULT '{}',
ADD COLUMN temporary_elevations JSONB DEFAULT '[]',
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- ===== CREATE ACCESS CONTROL ENUMS =====
CREATE TYPE access_level_enum AS ENUM (
    'LEVEL_1_VIEWER',
    'LEVEL_2_RECORDER', 
    'LEVEL_3_ANALYST',
    'LEVEL_4_MANAGER',
    'LEVEL_5_ADMIN'
);

CREATE TYPE role_enum AS ENUM (
    'farm_worker',
    'production_supervisor',
    'feed_manager', 
    'harvest_coordinator',
    'building_manager',
    'farm_analyst',
    'farm_owner'
);

-- ===== MIGRATE EXISTING ACCESS_TOOLS TO NEW SYSTEM =====
-- This function maps old checkbox permissions to new level + role system
CREATE OR REPLACE FUNCTION migrate_access_tools()
RETURNS void AS $$
DECLARE
    participant_record RECORD;
    new_level INTEGER;
    new_role TEXT;
BEGIN
    FOR participant_record IN SELECT * FROM participants LOOP
        -- Determine access level based on existing permissions
        IF array_length(participant_record.access_tools, 1) IS NULL THEN
            new_level := 1; -- LEVEL_1_VIEWER
            new_role := 'farm_worker';
        ELSIF 'Harvest Output' = ANY(participant_record.access_tools) THEN
            new_level := 5; -- LEVEL_5_ADMIN (Farm Owner)
            new_role := 'farm_owner';
        ELSIF 'Cost Management' = ANY(participant_record.access_tools) THEN
            new_level := 4; -- LEVEL_4_MANAGER
            new_role := 'building_manager';
        ELSIF 'Production Performance' = ANY(participant_record.access_tools) THEN
            new_level := 3; -- LEVEL_3_ANALYST
            new_role := 'farm_analyst';
        ELSIF 'Production Input' = ANY(participant_record.access_tools) THEN
            new_level := 2; -- LEVEL_2_RECORDER
            new_role := 'farm_worker';
        ELSE
            new_level := 1; -- LEVEL_1_VIEWER
            new_role := 'farm_worker';
        END IF;

        -- Special role assignments based on specific tool combinations
        IF 'Harvest Input' = ANY(participant_record.access_tools) AND 
           'Harvest Output' = ANY(participant_record.access_tools) THEN
            new_role := 'harvest_coordinator';
        END IF;

        -- Update the participant with new access control
        UPDATE participants 
        SET 
            access_level = new_level,
            role = new_role,
            updated_at = NOW()
        WHERE id = participant_record.id;
        
        -- Log the migration
        RAISE NOTICE 'Migrated participant %: % tools -> Level % (%)', 
            participant_record.name, 
            array_length(participant_record.access_tools, 1),
            new_level, 
            new_role;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_access_tools();

-- ===== CREATE ACCESS CONTROL LOG TABLE =====
CREATE TABLE access_control_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id INTEGER REFERENCES participants(id),
    farm_id UUID REFERENCES farms(id),
    action TEXT NOT NULL, -- 'level_change', 'role_change', 'permission_grant', etc.
    old_value JSONB,
    new_value JSONB,
    changed_by UUID REFERENCES auth.users(id),
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== CREATE PERMISSION CACHE TABLE =====
-- For performance optimization
CREATE TABLE participant_permission_cache (
    participant_id INTEGER PRIMARY KEY REFERENCES participants(id),
    permissions TEXT[] NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== CREATE INDEXES =====
CREATE INDEX idx_participants_access_level ON participants(access_level);
CREATE INDEX idx_participants_role ON participants(role);
CREATE INDEX idx_participants_farm_level ON participants(farm_id, access_level);
CREATE INDEX idx_access_control_logs_participant ON access_control_logs(participant_id);
CREATE INDEX idx_access_control_logs_timestamp ON access_control_logs(timestamp);

-- ===== CREATE FUNCTIONS =====

-- Function to get participant permissions
CREATE OR REPLACE FUNCTION get_participant_permissions(participant_id INTEGER)
RETURNS TEXT[] AS $$
DECLARE
    participant_data RECORD;
    level_permissions TEXT[];
    role_permissions TEXT[];
    final_permissions TEXT[];
BEGIN
    -- Get participant data
    SELECT access_level, role INTO participant_data 
    FROM participants WHERE id = participant_id;
    
    -- Get level-based permissions (inheritance)
    level_permissions := CASE participant_data.access_level
        WHEN 1 THEN ARRAY['view_dashboard', 'view_daily_records', 'view_production_data']
        WHEN 2 THEN ARRAY['view_dashboard', 'view_daily_records', 'view_production_data', 'input_daily_records', 'input_production_data', 'input_mortality_data']
        WHEN 3 THEN ARRAY['view_dashboard', 'view_daily_records', 'view_production_data', 'input_daily_records', 'input_production_data', 'input_mortality_data', 'view_analytics', 'view_financial_data', 'generate_reports', 'export_data']
        WHEN 4 THEN ARRAY['view_dashboard', 'view_daily_records', 'view_production_data', 'input_daily_records', 'input_production_data', 'input_mortality_data', 'view_analytics', 'view_financial_data', 'generate_reports', 'export_data', 'manage_buildings', 'manage_participants', 'manage_cycles', 'edit_historical_data']
        WHEN 5 THEN ARRAY['view_dashboard', 'view_daily_records', 'view_production_data', 'input_daily_records', 'input_production_data', 'input_mortality_data', 'view_analytics', 'view_financial_data', 'generate_reports', 'export_data', 'manage_buildings', 'manage_participants', 'manage_cycles', 'edit_historical_data', 'system_admin', 'access_api']
        ELSE ARRAY[]::TEXT[]
    END;
    
    -- Get role-specific permissions
    role_permissions := CASE participant_data.role
        WHEN 'farm_worker' THEN ARRAY['input_daily_records', 'input_production_data']
        WHEN 'production_supervisor' THEN ARRAY['edit_daily_records', 'edit_production_data']
        WHEN 'feed_manager' THEN ARRAY['view_feed_data', 'input_feed_data']
        WHEN 'harvest_coordinator' THEN ARRAY['view_harvest_data', 'input_harvest_data']
        WHEN 'building_manager' THEN ARRAY['manage_buildings', 'manage_cycles']
        WHEN 'farm_analyst' THEN ARRAY['view_analytics', 'generate_reports', 'access_api']
        WHEN 'farm_owner' THEN ARRAY['system_admin']
        ELSE ARRAY[]::TEXT[]
    END;
    
    -- Combine and deduplicate permissions
    SELECT ARRAY_AGG(DISTINCT permission) INTO final_permissions
    FROM (
        SELECT unnest(level_permissions) AS permission
        UNION
        SELECT unnest(role_permissions) AS permission
    ) combined;
    
    RETURN final_permissions;
END;
$$ LANGUAGE plpgsql;

-- Function to check if participant has specific permission
CREATE OR REPLACE FUNCTION participant_has_permission(
    participant_id INTEGER, 
    required_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    permissions TEXT[];
BEGIN
    permissions := get_participant_permissions(participant_id);
    RETURN required_permission = ANY(permissions);
END;
$$ LANGUAGE plpgsql;

-- Function to update permission cache
CREATE OR REPLACE FUNCTION update_permission_cache(participant_id INTEGER)
RETURNS void AS $$
DECLARE
    permissions TEXT[];
BEGIN
    permissions := get_participant_permissions(participant_id);
    
    INSERT INTO participant_permission_cache (participant_id, permissions)
    VALUES (participant_id, permissions)
    ON CONFLICT (participant_id) 
    DO UPDATE SET 
        permissions = EXCLUDED.permissions,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- ===== CREATE TRIGGERS =====

-- Trigger to update permission cache when participant changes
CREATE OR REPLACE FUNCTION trigger_update_permission_cache()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_permission_cache(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER participants_permission_cache_trigger
    AFTER INSERT OR UPDATE OF access_level, role ON participants
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_permission_cache();

-- Trigger to log access control changes
CREATE OR REPLACE FUNCTION trigger_log_access_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log level changes
    IF OLD.access_level IS DISTINCT FROM NEW.access_level THEN
        INSERT INTO access_control_logs (participant_id, farm_id, action, old_value, new_value)
        VALUES (NEW.id, NEW.farm_id, 'level_change', 
                to_jsonb(OLD.access_level), to_jsonb(NEW.access_level));
    END IF;
    
    -- Log role changes
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        INSERT INTO access_control_logs (participant_id, farm_id, action, old_value, new_value)
        VALUES (NEW.id, NEW.farm_id, 'role_change', 
                to_jsonb(OLD.role), to_jsonb(NEW.role));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER participants_access_log_trigger
    AFTER UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_access_changes();

-- ===== POPULATE INITIAL PERMISSION CACHE =====
INSERT INTO participant_permission_cache (participant_id, permissions)
SELECT id, get_participant_permissions(id)
FROM participants;

-- ===== ROW LEVEL SECURITY UPDATES =====

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view participants from their farms" ON participants;
DROP POLICY IF EXISTS "Users can manage participants in their farms" ON participants;

-- Create new RLS policies with level-based access
CREATE POLICY "Users can view participants from their farms" ON participants
    FOR SELECT USING (
        farm_id IN (
            SELECT id FROM farms WHERE owner_id = auth.uid()
        )
        OR 
        -- Participants can view other participants at same or lower level
        (id IN (
            SELECT id FROM participants 
            WHERE farm_id IN (SELECT farm_id FROM participants WHERE user_id = auth.uid())
            AND access_level <= (
                SELECT access_level FROM participants WHERE user_id = auth.uid()
            )
        ))
    );

CREATE POLICY "Users can manage participants in their farms" ON participants
    FOR ALL USING (
        -- Farm owners can manage all participants
        farm_id IN (
            SELECT id FROM farms WHERE owner_id = auth.uid()
        )
        OR
        -- Level 4+ participants can manage lower level participants
        (auth.uid() IN (
            SELECT user_id FROM participants 
            WHERE access_level >= 4 
            AND farm_id = participants.farm_id
        ) AND access_level < (
            SELECT access_level FROM participants WHERE user_id = auth.uid()
        ))
    );

-- ===== CREATE VIEWS =====

-- View for participant access summary
CREATE VIEW participant_access_summary AS
SELECT 
    p.id,
    p.name,
    p.code,
    p.access_level,
    p.role,
    f.name as farm_name,
    get_participant_permissions(p.id) as permissions,
    p.building_ids,
    p.working_hours,
    p.created_at,
    p.updated_at
FROM participants p
JOIN farms f ON p.farm_id = f.id;

-- ===== VERIFICATION QUERIES =====

-- Check migration results
SELECT 
    'Migration Summary' as check_type,
    COUNT(*) as total_participants,
    COUNT(CASE WHEN access_level = 1 THEN 1 END) as level_1_viewers,
    COUNT(CASE WHEN access_level = 2 THEN 1 END) as level_2_recorders,
    COUNT(CASE WHEN access_level = 3 THEN 1 END) as level_3_analysts,
    COUNT(CASE WHEN access_level = 4 THEN 1 END) as level_4_managers,
    COUNT(CASE WHEN access_level = 5 THEN 1 END) as level_5_admins
FROM participants;

-- Check role distribution
SELECT 
    role,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM participants), 2) as percentage
FROM participants 
GROUP BY role 
ORDER BY count DESC;

-- Verify permission cache
SELECT 
    'Permission Cache Status' as check_type,
    COUNT(*) as cached_participants,
    AVG(array_length(permissions, 1)) as avg_permissions_per_user
FROM participant_permission_cache;

COMMIT;

-- ===== CLEANUP OLD SYSTEM (OPTIONAL) =====
-- Uncomment these lines after verifying the migration works correctly

-- ALTER TABLE participants DROP COLUMN access_tools;
-- DROP TABLE participants_backup;

-- Add comment for future reference
COMMENT ON TABLE participants IS 'Participants table with hierarchical access control system. Migrated from checkbox-based access_tools to level + role system.';
COMMENT ON COLUMN participants.access_level IS 'Hierarchical access level (1-5) with inheritance';
COMMENT ON COLUMN participants.role IS 'Job role determining specific permissions and responsibilities';
COMMENT ON COLUMN participants.building_ids IS 'Specific buildings this participant can access (NULL = all buildings)';
COMMENT ON COLUMN participants.working_hours IS 'JSON object defining working hour restrictions';

