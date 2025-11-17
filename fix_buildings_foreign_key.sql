-- Fix Buildings Foreign Key Constraint Issues
-- This script fixes the incorrect foreign key constraint that references users instead of farms

-- 1. First, let's check the current constraint definition
SELECT '=== CURRENT BUILDINGS CONSTRAINT ANALYSIS ===' as status;

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
    AND tc.table_name = 'buildings'
    AND kcu.column_name = 'farm_id';

-- 2. Drop the incorrect foreign key constraint
SELECT '=== DROPPING INCORRECT BUILDINGS CONSTRAINT ===' as status;

DO $$
BEGIN
    -- Drop the incorrect foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'buildings_farm_id_fkey' 
        AND table_name = 'buildings'
    ) THEN
        ALTER TABLE buildings DROP CONSTRAINT buildings_farm_id_fkey;
        RAISE NOTICE 'Dropped incorrect buildings_farm_id_fkey constraint';
    ELSE
        RAISE NOTICE 'buildings_farm_id_fkey constraint not found';
    END IF;
END $$;

-- 3. Check if there are any orphaned building records
SELECT '=== CHECKING FOR ORPHANED BUILDINGS ===' as status;

SELECT 
    b.id as building_id,
    b.building_number,
    b.farm_id,
    CASE 
        WHEN f.id IS NULL THEN 'ORPHANED - FARM NOT FOUND'
        ELSE 'VALID'
    END as status
FROM buildings b
LEFT JOIN farms f ON b.farm_id = f.id
WHERE f.id IS NULL;

-- 4. Fix orphaned building records
SELECT '=== FIXING ORPHANED BUILDINGS ===' as status;

DO $$
DECLARE
    building_record RECORD;
    user_id UUID;
    correct_farm_id UUID;
BEGIN
    -- Loop through orphaned buildings
    FOR building_record IN 
        SELECT b.id, b.farm_id, b.building_number
        FROM buildings b
        LEFT JOIN farms f ON b.farm_id = f.id
        WHERE f.id IS NULL AND b.farm_id IS NOT NULL
    LOOP
        -- Check if the farm_id is actually a user_id
        SELECT id INTO user_id FROM auth.users WHERE id = building_record.farm_id;
        
        IF user_id IS NOT NULL THEN
            -- Check if this user already has a farm
            SELECT id INTO correct_farm_id FROM farms WHERE owner_id = user_id LIMIT 1;
            
            IF correct_farm_id IS NULL THEN
                -- Create a new farm for this user
                INSERT INTO farms (id, name, owner_id, created_at, updated_at)
                VALUES (
                    gen_random_uuid(),
                    'Default Farm',
                    user_id,
                    NOW(),
                    NOW()
                )
                RETURNING id INTO correct_farm_id;
                
                RAISE NOTICE 'Created new farm % for user %', correct_farm_id, user_id;
            END IF;
            
            -- Update the building to use the correct farm_id
            UPDATE buildings 
            SET farm_id = correct_farm_id 
            WHERE id = building_record.id;
            
            RAISE NOTICE 'Fixed building % (%), assigned to farm %', 
                building_record.building_number, building_record.id, correct_farm_id;
        ELSE
            -- If farm_id is not a valid user_id, assign to the first available farm
            SELECT id INTO correct_farm_id FROM farms LIMIT 1;
            IF correct_farm_id IS NOT NULL THEN
                UPDATE buildings 
                SET farm_id = correct_farm_id 
                WHERE id = building_record.id;
                
                RAISE NOTICE 'Fixed building % (%), assigned to default farm %', 
                    building_record.building_number, building_record.id, correct_farm_id;
            END IF;
        END IF;
    END LOOP;
END $$;

-- 5. Add the correct foreign key constraint for buildings
SELECT '=== ADDING CORRECT BUILDINGS FOREIGN KEY CONSTRAINT ===' as status;

DO $$
BEGIN
    -- Add the correct foreign key constraint
    ALTER TABLE buildings 
    ADD CONSTRAINT buildings_farm_id_fkey 
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added correct buildings_farm_id_fkey constraint';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists';
    WHEN others THEN
        RAISE NOTICE 'Error adding constraint: %', SQLERRM;
END $$;

-- 6. Verify the fix
SELECT '=== BUILDINGS VERIFICATION ===' as status;

-- Check the new constraint definition
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
    AND tc.table_name = 'buildings'
    AND kcu.column_name = 'farm_id';

-- Check that all buildings now have valid farm_id references
SELECT 'Buildings with valid farm_id:' as status;
SELECT COUNT(*) as valid_buildings
FROM buildings b
JOIN farms f ON b.farm_id = f.id;

-- Show final state
SELECT '=== FINAL BUILDINGS STATE ===' as status;
SELECT 
    f.id as farm_id,
    f.name as farm_name,
    f.owner_id,
    u.email as owner_email,
    (SELECT COUNT(*) FROM buildings b WHERE b.farm_id = f.id) as building_count
FROM farms f
LEFT JOIN auth.users u ON f.owner_id = u.id
ORDER BY f.created_at DESC;

SELECT '=== BUILDINGS FOREIGN KEY CONSTRAINT FIX COMPLETED ===' as status;
