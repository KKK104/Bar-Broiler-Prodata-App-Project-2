-- ============================================
-- SAFE DATABASE OPTIMIZATION FOR VERIFICATION SYSTEM
-- ============================================

-- 1. Create composite indexes for faster queries (safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_verification_status_composite') THEN
        CREATE INDEX idx_user_verification_status_composite 
        ON user_verification_status(user_id, is_verified, has_completed_onboarding);
        RAISE NOTICE 'Created composite index';
    ELSE
        RAISE NOTICE 'Composite index already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_verification_status_created_verified') THEN
        CREATE INDEX idx_user_verification_status_created_verified 
        ON user_verification_status(created_at, verified_at);
        RAISE NOTICE 'Created created_verified index';
    ELSE
        RAISE NOTICE 'Created_verified index already exists';
    END IF;
END $$;

-- 2. Create partial indexes for common query patterns (safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_verification_status_new_users') THEN
        CREATE INDEX idx_user_verification_status_new_users 
        ON user_verification_status(user_id) 
        WHERE is_new_user = TRUE AND is_verified = TRUE;
        RAISE NOTICE 'Created new users partial index';
    ELSE
        RAISE NOTICE 'New users partial index already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_verification_status_completed') THEN
        CREATE INDEX idx_user_verification_status_completed 
        ON user_verification_status(user_id) 
        WHERE has_completed_onboarding = TRUE;
        RAISE NOTICE 'Created completed partial index';
    ELSE
        RAISE NOTICE 'Completed partial index already exists';
    END IF;
END $$;

-- 3. Create function for fast user status lookup (safe)
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

-- 4. Create function for batch user status lookup (safe)
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

-- 5. Create materialized view for frequently accessed data (safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'user_verification_summary') THEN
        CREATE MATERIALIZED VIEW user_verification_summary AS
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
        RAISE NOTICE 'Created materialized view';
    ELSE
        RAISE NOTICE 'Materialized view already exists';
    END IF;
END $$;

-- Create index on materialized view (safe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_verification_summary_user_id') THEN
        CREATE INDEX idx_user_verification_summary_user_id 
        ON user_verification_summary(user_id);
        RAISE NOTICE 'Created materialized view index';
    ELSE
        RAISE NOTICE 'Materialized view index already exists';
    END IF;
END $$;

-- 6. Create function to refresh materialized view (safe)
CREATE OR REPLACE FUNCTION refresh_verification_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_verification_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to auto-refresh materialized view (safe)
CREATE OR REPLACE FUNCTION trigger_refresh_verification_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule refresh (non-blocking)
    PERFORM pg_notify('refresh_verification_summary', '');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_refresh_verification_summary_after_update ON user_verification_status;
DROP TRIGGER IF EXISTS trigger_refresh_verification_summary_after_insert ON user_verification_status;

-- Create new triggers
CREATE TRIGGER trigger_refresh_verification_summary_after_update
    AFTER UPDATE ON user_verification_status
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_verification_summary();

CREATE TRIGGER trigger_refresh_verification_summary_after_insert
    AFTER INSERT ON user_verification_status
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_verification_summary();

-- 8. Create function for analytics and monitoring (safe)
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

-- 9. Create function for cleanup and maintenance (safe)
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

-- 10. Create function for performance monitoring (safe)
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

-- 11. Create scheduled maintenance function (safe)
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

-- 12. Create function for bulk operations (safe)
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
-- PERFORMANCE MONITORING VIEWS (SAFE)
-- ============================================

-- Create view for slow queries (safe)
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

-- Create view for index usage (safe)
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
-- OPTIMIZATION COMPLETE - SAFE VERSION
-- ============================================

-- Show optimization results
SELECT 'Safe database optimization completed successfully!' as status;

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

-- Show materialized view information
SELECT 
    schemaname,
    matviewname,
    definition
FROM pg_matviews 
WHERE matviewname = 'user_verification_summary';

-- Show function information
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname IN (
    'get_user_status_fast',
    'get_multiple_user_status',
    'refresh_verification_summary',
    'get_verification_analytics',
    'cleanup_verification_data',
    'get_verification_performance_stats',
    'scheduled_verification_maintenance',
    'bulk_update_verification_status'
);







