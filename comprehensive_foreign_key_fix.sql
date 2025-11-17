-- Comprehensive Foreign Key Constraint Fix
-- This script fixes all foreign key constraint issues in the database

-- 1. Initial diagnostic
SELECT '=== STARTING COMPREHENSIVE FOREIGN KEY FIX ===' as status;

-- Check all foreign key constraints
SELECT '=== CURRENT FOREIGN KEY CONSTRAINTS ===' as status;
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
    AND tc.table_name IN ('participants', 'buildings', 'calculator_sessions')
ORDER BY tc.table_name, kcu.column_name;

-- 2. Drop all incorrect foreign key constraints
SELECT '=== DROPPING INCORRECT CONSTRAINTS ===' as status;

DO $$
BEGIN
    -- Drop participants constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'participants_farm_id_fkey' 
        AND table_name = 'participants'
    ) THEN
        ALTER TABLE participants DROP CONSTRAINT participants_farm_id_fkey;
        RAISE NOTICE 'Dropped participants_farm_id_fkey constraint';
    END IF;
    
    -- Drop buildings constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'buildings_farm_id_fkey' 
        AND table_name = 'buildings'
    ) THEN
        ALTER TABLE buildings DROP CONSTRAINT buildings_farm_id_fkey;
        RAISE NOTICE 'Dropped buildings_farm_id_fkey constraint';
    END IF;
    
    -- Drop calculator_sessions constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'calculator_sessions_farm_id_fkey' 
        AND table_name = 'calculator_sessions'
    ) THEN
        ALTER TABLE calculator_sessions DROP CONSTRAINT calculator_sessions_farm_id_fkey;
        RAISE NOTICE 'Dropped calculator_sessions_farm_id_fkey constraint';
    END IF;
    
    -- Drop calculator_sessions building_id constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'calculator_sessions_building_id_fkey' 
        AND table_name = 'calculator_sessions'
    ) THEN
        ALTER TABLE calculator_sessions DROP CONSTRAINT calculator_sessions_building_id_fkey;
        RAISE NOTICE 'Dropped calculator_sessions_building_id_fkey constraint';
    END IF;
END $$;

-- 3. Check for orphaned records
SELECT '=== CHECKING ORPHANED RECORDS ===' as status;

-- Check participants
SELECT 'Orphaned participants:' as status;
SELECT COUNT(*) as orphaned_count
FROM participants p
LEFT JOIN farms f ON p.farm_id = f.id
WHERE f.id IS NULL AND p.farm_id IS NOT NULL;

-- Check buildings
SELECT 'Orphaned buildings:' as status;
SELECT COUNT(*) as orphaned_count
FROM buildings b
LEFT JOIN farms f ON b.farm_id = f.id
WHERE f.id IS NULL AND b.farm_id IS NOT NULL;

-- Check calculator_sessions
SELECT 'Orphaned calculator_sessions:' as status;
SELECT COUNT(*) as orphaned_count
FROM calculator_sessions cs
LEFT JOIN farms f ON cs.farm_id = f.id
WHERE f.id IS NULL AND cs.farm_id IS NOT NULL;

-- 4. Fix orphaned records
SELECT '=== FIXING ORPHANED RECORDS ===' as status;

DO $$
DECLARE
    record_data RECORD;
    user_id UUID;
    correct_farm_id UUID;
BEGIN
    -- Fix orphaned participants
    FOR record_data IN 
        SELECT p.id, p.farm_id, p.name, 'participant' as table_type
        FROM participants p
        LEFT JOIN farms f ON p.farm_id = f.id
        WHERE f.id IS NULL AND p.farm_id IS NOT NULL
    LOOP
        -- Check if farm_id is actually a user_id
        SELECT id INTO user_id FROM auth.users WHERE id = record_data.farm_id;
        
        IF user_id IS NOT NULL THEN
            -- Check if user has a farm
            SELECT id INTO correct_farm_id FROM farms WHERE owner_id = user_id LIMIT 1;
            
            IF correct_farm_id IS NULL THEN
                -- Create farm for user
                INSERT INTO farms (id, name, owner_id, created_at, updated_at)
                VALUES (gen_random_uuid(), 'Default Farm', user_id, NOW(), NOW())
                RETURNING id INTO correct_farm_id;
                RAISE NOTICE 'Created farm % for user %', correct_farm_id, user_id;
            END IF;
            
            -- Update participant
            UPDATE participants SET farm_id = correct_farm_id WHERE id = record_data.id;
            RAISE NOTICE 'Fixed participant % (%), assigned to farm %', record_data.name, record_data.id, correct_farm_id;
        ELSE
            -- Assign to first available farm
            SELECT id INTO correct_farm_id FROM farms LIMIT 1;
            IF correct_farm_id IS NOT NULL THEN
                UPDATE participants SET farm_id = correct_farm_id WHERE id = record_data.id;
                RAISE NOTICE 'Fixed participant % (%), assigned to default farm %', record_data.name, record_data.id, correct_farm_id;
            END IF;
        END IF;
    END LOOP;
    
    -- Fix orphaned buildings
    FOR record_data IN 
        SELECT b.id, b.farm_id, b.building_number, 'building' as table_type
        FROM buildings b
        LEFT JOIN farms f ON b.farm_id = f.id
        WHERE f.id IS NULL AND b.farm_id IS NOT NULL
    LOOP
        -- Check if farm_id is actually a user_id
        SELECT id INTO user_id FROM auth.users WHERE id = record_data.farm_id;
        
        IF user_id IS NOT NULL THEN
            -- Check if user has a farm
            SELECT id INTO correct_farm_id FROM farms WHERE owner_id = user_id LIMIT 1;
            
            IF correct_farm_id IS NULL THEN
                -- Create farm for user
                INSERT INTO farms (id, name, owner_id, created_at, updated_at)
                VALUES (gen_random_uuid(), 'Default Farm', user_id, NOW(), NOW())
                RETURNING id INTO correct_farm_id;
                RAISE NOTICE 'Created farm % for user %', correct_farm_id, user_id;
            END IF;
            
            -- Update building
            UPDATE buildings SET farm_id = correct_farm_id WHERE id = record_data.id;
            RAISE NOTICE 'Fixed building % (%), assigned to farm %', record_data.building_number, record_data.id, correct_farm_id;
        ELSE
            -- Assign to first available farm
            SELECT id INTO correct_farm_id FROM farms LIMIT 1;
            IF correct_farm_id IS NOT NULL THEN
                UPDATE buildings SET farm_id = correct_farm_id WHERE id = record_data.id;
                RAISE NOTICE 'Fixed building % (%), assigned to default farm %', record_data.building_number, record_data.id, correct_farm_id;
            END IF;
        END IF;
    END LOOP;
    
    -- Fix orphaned calculator_sessions
    FOR record_data IN 
        SELECT cs.id, cs.farm_id, cs.building_id, 'calculator_session' as table_type
        FROM calculator_sessions cs
        LEFT JOIN farms f ON cs.farm_id = f.id
        WHERE f.id IS NULL AND cs.farm_id IS NOT NULL
    LOOP
        -- Check if farm_id is actually a user_id
        SELECT id INTO user_id FROM auth.users WHERE id = record_data.farm_id;
        
        IF user_id IS NOT NULL THEN
            -- Check if user has a farm
            SELECT id INTO correct_farm_id FROM farms WHERE owner_id = user_id LIMIT 1;
            
            IF correct_farm_id IS NULL THEN
                -- Create farm for user
                INSERT INTO farms (id, name, owner_id, created_at, updated_at)
                VALUES (gen_random_uuid(), 'Default Farm', user_id, NOW(), NOW())
                RETURNING id INTO correct_farm_id;
                RAISE NOTICE 'Created farm % for user %', correct_farm_id, user_id;
            END IF;
            
            -- Update calculator_session
            UPDATE calculator_sessions SET farm_id = correct_farm_id WHERE id = record_data.id;
            RAISE NOTICE 'Fixed calculator session %, assigned to farm %', record_data.id, correct_farm_id;
        ELSE
            -- Assign to first available farm
            SELECT id INTO correct_farm_id FROM farms LIMIT 1;
            IF correct_farm_id IS NOT NULL THEN
                UPDATE calculator_sessions SET farm_id = correct_farm_id WHERE id = record_data.id;
                RAISE NOTICE 'Fixed calculator session %, assigned to default farm %', record_data.id, correct_farm_id;
            END IF;
        END IF;
    END LOOP;
END $$;

-- 5. Add correct foreign key constraints
SELECT '=== ADDING CORRECT FOREIGN KEY CONSTRAINTS ===' as status;

DO $$
BEGIN
    -- Add participants constraint
    ALTER TABLE participants 
    ADD CONSTRAINT participants_farm_id_fkey 
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added participants_farm_id_fkey constraint';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'participants_farm_id_fkey constraint already exists';
    WHEN others THEN
        RAISE NOTICE 'Error adding participants constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Add buildings constraint
    ALTER TABLE buildings 
    ADD CONSTRAINT buildings_farm_id_fkey 
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added buildings_farm_id_fkey constraint';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'buildings_farm_id_fkey constraint already exists';
    WHEN others THEN
        RAISE NOTICE 'Error adding buildings constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Add calculator_sessions farm_id constraint
    ALTER TABLE calculator_sessions 
    ADD CONSTRAINT calculator_sessions_farm_id_fkey 
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added calculator_sessions_farm_id_fkey constraint';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'calculator_sessions_farm_id_fkey constraint already exists';
    WHEN others THEN
        RAISE NOTICE 'Error adding calculator_sessions farm_id constraint: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Add calculator_sessions building_id constraint
    ALTER TABLE calculator_sessions 
    ADD CONSTRAINT calculator_sessions_building_id_fkey 
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added calculator_sessions_building_id_fkey constraint';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'calculator_sessions_building_id_fkey constraint already exists';
    WHEN others THEN
        RAISE NOTICE 'Error adding calculator_sessions building_id constraint: %', SQLERRM;
END $$;

-- 6. Final verification
SELECT '=== FINAL VERIFICATION ===' as status;

-- Check all foreign key constraints
SELECT 'Updated foreign key constraints:' as status;
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
    AND tc.table_name IN ('participants', 'buildings', 'calculator_sessions')
ORDER BY tc.table_name, kcu.column_name;

-- Verify no orphaned records remain
SELECT 'Verification - no orphaned records:' as status;
SELECT 
    'participants' as table_name,
    COUNT(*) as orphaned_count
FROM participants p
LEFT JOIN farms f ON p.farm_id = f.id
WHERE f.id IS NULL AND p.farm_id IS NOT NULL

UNION ALL

SELECT 
    'buildings' as table_name,
    COUNT(*) as orphaned_count
FROM buildings b
LEFT JOIN farms f ON b.farm_id = f.id
WHERE f.id IS NULL AND b.farm_id IS NOT NULL

UNION ALL

SELECT 
    'calculator_sessions' as table_name,
    COUNT(*) as orphaned_count
FROM calculator_sessions cs
LEFT JOIN farms f ON cs.farm_id = f.id
WHERE f.id IS NULL AND cs.farm_id IS NOT NULL;

-- Show final state
SELECT '=== FINAL DATABASE STATE ===' as status;
SELECT 
    f.id as farm_id,
    f.name as farm_name,
    f.owner_id,
    u.email as owner_email,
    (SELECT COUNT(*) FROM participants p WHERE p.farm_id = f.id) as participant_count,
    (SELECT COUNT(*) FROM buildings b WHERE b.farm_id = f.id) as building_count,
    (SELECT COUNT(*) FROM calculator_sessions cs WHERE cs.farm_id = f.id) as session_count
FROM farms f
LEFT JOIN auth.users u ON f.owner_id = u.id
ORDER BY f.created_at DESC;

SELECT '=== COMPREHENSIVE FOREIGN KEY FIX COMPLETED ===' as status;
