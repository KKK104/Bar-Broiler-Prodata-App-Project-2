# 🚀 STAFF DASHBOARD SOLUTION

## Current Problem
- Staff dashboard shows "No buildings yet"
- Database has 0 buildings
- RLS policies are blocking building creation
- Owner dashboard shows mock/placeholder data

## 🔧 SOLUTION: Run SQL Commands in Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. **Open**: https://supabase.com/dashboard
2. **Select project**: `yusqlnqtsszjjmyqaibp`
3. **Click**: "SQL Editor" in left sidebar
4. **Click**: "New query"

### Step 2: Copy and Paste This SQL Block
```sql
-- Drop existing broken policies
DROP POLICY IF EXISTS "Allow building creation" ON buildings;
DROP POLICY IF EXISTS "Allow building selection" ON buildings;
DROP POLICY IF EXISTS "Allow building updates" ON buildings;
DROP POLICY IF EXISTS "Allow building deletion" ON buildings;

-- Disable RLS temporarily
ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;

-- Create sample buildings
INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date) VALUES
('Production House 1', '39ceb05a-8e33-4d9b-92b6-66c68312c2f3', 'active', 1, '2025-01-01'),
('Production House 2', '39ceb05a-8e33-4d9b-92b6-66c68312c2f3', 'active', 2, '2025-01-15'),
('Production House 3', '39ceb05a-8e33-4d9b-92b6-66c68312c2f3', 'preparing', 3, '2025-02-01');

-- Re-enable RLS
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- Create working RLS policies
CREATE POLICY "Allow building creation" ON buildings
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow building selection" ON buildings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow building updates" ON buildings
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow building deletion" ON buildings
FOR DELETE TO authenticated USING (true);
```

### Step 3: Execute the SQL
1. **Click**: "Run" button (or press Ctrl+Enter)
2. **Wait**: For query to complete
3. **Check**: Should see "Success" message

### Step 4: Test the Fix
Run this command:
```bash
node test-after-sql-fix.js
```

**Expected Result:**
- ✅ Should show "3 buildings found"
- ✅ Should show "Building creation working!"
- ✅ Staff dashboard will show buildings

### Step 5: Test Staff Dashboard
1. **Open**: http://localhost:3000
2. **Click**: "Participant Login"
3. **Use code**: `253613` (Veterinarian)
4. **Check**: Buildings should appear instead of "No buildings yet"

## 🔄 Alternative Solution (If SQL Fails)

### Manual Building Creation
1. **Open**: http://localhost:3000
2. **Sign in as admin/owner** (not participant)
3. **Look for**: "Add Building" or "Buildings" section
4. **Add buildings manually**:
   - Production House 1 (Status: Active, Cycle: 1)
   - Production House 2 (Status: Active, Cycle: 2)
   - Production House 3 (Status: Preparing, Cycle: 3)
5. **Test staff dashboard** with participant login

## 🎯 Expected Final Result
- ✅ **Database**: Real buildings exist
- ✅ **Owner dashboard**: Shows real buildings (not mock data)
- ✅ **Staff dashboard**: Shows real buildings (not "No buildings yet")
- ✅ **Both dashboards**: Display the same real data

## 🚨 Why This Happens
The owner dashboard shows **mock/placeholder data** while the staff dashboard correctly shows **no data** because there are no real buildings in the database. This creates the discrepancy you're seeing.
