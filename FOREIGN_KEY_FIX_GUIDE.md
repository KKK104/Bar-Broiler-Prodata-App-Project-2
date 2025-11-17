# Foreign Key Constraint Fix Guide

## Problem
You're getting this error:
```
ERROR: 23503: insert or update on table "participants" violates foreign key constraint "participants_farm_id_fkey"
DETAIL: Key (farm_id)=(73341b99-2645-4ddd-ad41-1513924d4fe8) is not present in table "users".
```

## Root Cause
The foreign key constraint `participants_farm_id_fkey` is incorrectly referencing the `users` table instead of the `farms` table. This is a database schema issue.

## Solution

### Step 1: Run the Comprehensive Fix Script
1. Go to your **Supabase Dashboard**
2. Open the **SQL Editor**
3. Copy and paste the entire contents of `comprehensive_foreign_key_fix.sql`
4. Click **Run** to execute the script

### What the Script Does:
1. **Analyzes** current foreign key constraints
2. **Drops** incorrect constraints that reference the wrong tables
3. **Fixes** orphaned records by creating proper farm relationships
4. **Adds** correct foreign key constraints that reference the `farms` table
5. **Verifies** that all relationships are now correct

### Step 2: Verify the Fix
After running the script, you should see:
- All foreign key constraints now reference the correct tables
- No orphaned records remaining
- Participants, buildings, and calculator sessions all have valid farm_id references

### Step 3: Test Your Application
After the database fix:
1. Try adding a new participant
2. Try adding a new building
3. Try creating a calculator session

These operations should now work without foreign key constraint errors.

## Alternative: Individual Fix Scripts
If you prefer to fix tables individually, you can use:
- `fix_foreign_key_constraints.sql` - for participants table only
- `fix_buildings_foreign_key.sql` - for buildings table only

## Expected Results
After running the fix:
- ✅ No more foreign key constraint violations
- ✅ All participants linked to valid farms
- ✅ All buildings linked to valid farms
- ✅ All calculator sessions linked to valid farms
- ✅ Proper database relationships maintained

## If You Still Get Errors
If you continue to get errors after running the fix:
1. Check the Supabase logs for any remaining constraint issues
2. Verify that the `farms` table has the correct structure with `id` and `owner_id` columns
3. Ensure all users have associated farm records

The comprehensive fix script should resolve all these issues automatically.
