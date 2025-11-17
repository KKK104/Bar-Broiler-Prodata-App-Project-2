# Quick Fix Guide for Database Issues

## Problem Summary
Your application is experiencing foreign key constraint violations when trying to add participants and buildings. The main issues are:

1. **Foreign key constraint violation**: `participants_farm_id_fkey` - Participants are being created with invalid farm IDs
2. **409 Conflict errors**: Multiple attempts to create the same data
3. **406 errors**: API endpoint issues with calculator sessions

## Root Cause
The application is trying to use user IDs as farm IDs, but farm IDs should reference actual farm records in the database.

## Solution Steps

### Step 1: Fix the Database (CRITICAL)
1. Go to your **Supabase Dashboard**
2. Open the **SQL Editor**
3. Copy and paste the entire contents of `comprehensive_database_fix.sql`
4. Click **Run** to execute the script
5. This will:
   - Create missing farms for users
   - Fix orphaned records
   - Clean up duplicate data
   - Validate all foreign key relationships

### Step 2: Deploy the Updated Application
Run the redeployment script:
```bash
./redeploy-with-fixes.bat
```

Or manually:
```bash
npm run build
netlify deploy --prod --dir=out
```

### Step 3: Test the Application
After running the database fix and redeploying, test these features:

1. **Adding Participants**: Should work without foreign key errors
2. **Adding Buildings**: Should work without foreign key errors  
3. **Calculator Sessions**: Should work without 409/406 errors

## What the Database Fix Does

### 1. Creates Missing Farms
- Ensures every user has a farm record
- Links farms to users via `owner_id` column

### 2. Fixes Orphaned Records
- Updates participants with invalid `farm_id` to use correct farm IDs
- Updates buildings with invalid `farm_id` to use correct farm IDs
- Updates calculator sessions with invalid `farm_id` to use correct farm IDs

### 3. Cleans Up Duplicates
- Removes duplicate participant records
- Removes duplicate calculator session records

### 4. Validates Relationships
- Ensures all foreign key constraints are satisfied
- Provides a summary of the final database state

## Prevention
The updated application code now includes:
- Farm ID validation before creating records
- Better error handling and logging
- Automatic farm creation for new users

## If Issues Persist
If you still encounter issues after running the database fix:

1. **Check the console logs** for specific error messages
2. **Verify the database fix ran successfully** by checking the verification section output
3. **Clear browser cache** and try again
4. **Check Supabase logs** for any remaining constraint violations

## Emergency Clean Slate Option
If you want to start fresh (WARNING: This will delete all data):

1. Go to Supabase Dashboard
2. Delete all tables: `participants`, `buildings`, `calculator_sessions`, `farms`
3. Recreate the tables with proper foreign key constraints
4. Redeploy the application

## Support
If you need help with any of these steps, the database fix script includes detailed logging that will help identify any remaining issues.
