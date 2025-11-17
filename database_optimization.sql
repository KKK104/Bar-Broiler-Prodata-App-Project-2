-- ============================================
-- DATABASE OPTIMIZATION FOR VERIFICATION SYSTEM
-- ============================================

-- 1. Create composite indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_verification_status_composite 
ON user_verification_status(user_id, is_verified, has_completed_onboarding);

CREATE INDEX IF NOT EXISTS idx_user_verification_status_created_verified 
ON user_verification_status(created_at, verified_at);

-- 2. Create partial indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_verification_status_new_users 
ON user_verification_status(user_id) 
WHERE is_new_user = TRUE AND is_verified = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_verification_status_completed 
ON user_verification_status(user_id) 
WHERE has_completed_onboarding = TRUE;

-- 3. Create function for fast user status lookup
CREATE OR REPLACE FUNCTION get_user_status_fast(user_uuid UUID)
RETURNS TABLE(
    is_verified BOOLEAN,
    is_new_user BOOLEAN,
    has_completed_onboarding BOOLEAN,
    verified_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uvs.is_verified,
        uvs.is_new_user,
        uvs.has_completed_onboarding,
        uvs.verified_at,
        uvs.onboarding_completed_at
    FROM user_verification_status uvs
    WHERE uvs.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function for batch user status lookup
CREATE OR REPLACE FUNCTION get_multiple_user_status(user_uuids UUID[])
RETURNS TABLE(
    user_id UUID,
    is_verified BOOLEAN,
    is_new_user BOOLEAN,
    has_completed_onboarding BOOLEAN,
    verified_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uvs.user_id,
        uvs.is_verified,
        uvs.is_new_user,
        uvs.has_completed_onboarding,
        uvs.verified_at,
        uvs.onboarding_completed_at
    FROM user_verification_status uvs
    WHERE uvs.user_id = ANY(user_uuids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create materialized view for frequently accessed data
CREATE MATERIALIZED VIEW IF NOT EXISTS user_verification_summary AS
SELECT 
    user_id,
    email,
    is_verified,
    is_new_user,
    has_completed_onboarding,
    verified_at,
    onboarding_completed_at,
    created_at,
    updated_at
FROM user_verification_status
WHERE is_verified = TRUE;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_user_verification_summary_user_id 
ON user_verification_summary(user_id);

-- 6. Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_verification_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_verification_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to auto-refresh materialized view
CREATE OR REPLACE FUNCTION trigger_refresh_verification_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule refresh (non-blocking)
    PERFORM pg_notify('refresh_verification_summary', '');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_verification_summary_after_update
    AFTER UPDATE ON user_verification_status
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_verification_summary();

CREATE TRIGGER trigger_refresh_verification_summary_after_insert
    AFTER INSERT ON user_verification_status
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_verification_summary();

-- 8. Create function for analytics and monitoring
CREATE OR REPLACE FUNCTION get_verification_analytics()
RETURNS TABLE(
    total_users INTEGER,
    verified_users INTEGER,
    new_users INTEGER,
    completed_onboarding INTEGER,
    verification_rate NUMERIC,
    onboarding_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_users,
        COUNT(*) FILTER (WHERE is_verified = TRUE)::INTEGER as verified_users,
        COUNT(*) FILTER (WHERE is_new_user = TRUE)::INTEGER as new_users,
        COUNT(*) FILTER (WHERE has_completed_onboarding = TRUE)::INTEGER as completed_onboarding,
        ROUND(
            (COUNT(*) FILTER (WHERE is_verified = TRUE)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
            2
        ) as verification_rate,
        ROUND(
            (COUNT(*) FILTER (WHERE has_completed_onboarding = TRUE)::NUMERIC / COUNT(*) FILTER (WHERE is_verified = TRUE)::NUMERIC) * 100, 
            2
        ) as onboarding_rate
    FROM user_verification_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function for cleanup and maintenance
CREATE OR REPLACE FUNCTION cleanup_verification_data()
RETURNS TABLE(
    orphaned_records INTEGER,
    cleaned_records INTEGER
) AS $$
DECLARE
    orphaned_count INTEGER;
    cleaned_count INTEGER;
BEGIN
    -- Count orphaned records
    SELECT COUNT(*) INTO orphaned_count
    FROM user_verification_status uvs
    LEFT JOIN auth.users u ON uvs.user_id = u.id
    WHERE u.id IS NULL;
    
    -- Delete orphaned records
    DELETE FROM user_verification_status uvs
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users u WHERE u.id = uvs.user_id
    );
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN QUERY SELECT orphaned_count, cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function for performance monitoring
CREATE OR REPLACE FUNCTION get_verification_performance_stats()
RETURNS TABLE(
    table_size BIGINT,
    index_size BIGINT,
    cache_hit_ratio NUMERIC,
    last_vacuum TIMESTAMP WITH TIME ZONE,
    last_analyze TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg_total_relation_size('user_verification_status') as table_size,
        pg_indexes_size('user_verification_status') as index_size,
        ROUND(
            (heap_blks_hit::NUMERIC / (heap_blks_hit + heap_blks_read)::NUMERIC) * 100, 
            2
        ) as cache_hit_ratio,
        last_vacuum,
        last_analyze
    FROM pg_stat_user_tables 
    WHERE relname = 'user_verification_status';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create scheduled maintenance function
CREATE OR REPLACE FUNCTION scheduled_verification_maintenance()
RETURNS VOID AS $$
BEGIN
    -- Refresh materialized view
    REFRESH MATERIALIZED VIEW user_verification_summary;
    
    -- Update table statistics
    ANALYZE user_verification_status;
    
    -- Clean up orphaned records
    PERFORM cleanup_verification_data();
    
    -- Log maintenance completion
    INSERT INTO pg_stat_statements_info (dealloc) VALUES (1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function for bulk operations
CREATE OR REPLACE FUNCTION bulk_update_verification_status(
    user_updates JSONB
)
RETURNS INTEGER AS $$
DECLARE
    update_count INTEGER := 0;
    user_update JSONB;
BEGIN
    FOR user_update IN SELECT * FROM jsonb_array_elements(user_updates)
    LOOP
        UPDATE user_verification_status 
        SET 
            is_verified = (user_update->>'is_verified')::BOOLEAN,
            is_new_user = (user_update->>'is_new_user')::BOOLEAN,
            has_completed_onboarding = (user_update->>'has_completed_onboarding')::BOOLEAN,
            verified_at = CASE 
                WHEN user_update->>'verified_at' IS NOT NULL 
                THEN (user_update->>'verified_at')::TIMESTAMP WITH TIME ZONE 
                ELSE verified_at 
            END,
            onboarding_completed_at = CASE 
                WHEN user_update->>'onboarding_completed_at' IS NOT NULL 
                THEN (user_update->>'onboarding_completed_at')::TIMESTAMP WITH TIME ZONE 
                ELSE onboarding_completed_at 
            END,
            updated_at = NOW()
        WHERE user_id = (user_update->>'user_id')::UUID;
        
        GET DIAGNOSTICS update_count = ROW_COUNT;
    END LOOP;
    
    RETURN update_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================

-- Create view for slow queries
CREATE OR REPLACE VIEW verification_slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%user_verification_status%'
ORDER BY mean_time DESC;

-- Create view for index usage
CREATE OR REPLACE VIEW verification_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'user_verification_status'
ORDER BY idx_scan DESC;

-- ============================================
-- OPTIMIZATION COMPLETE
-- ============================================

-- Show optimization results
SELECT 'Database optimization completed successfully!' as status;

-- Show current table statistics
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'user_verification_status'
ORDER BY attname;

-- Show index information
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_verification_status'
ORDER BY indexname;







