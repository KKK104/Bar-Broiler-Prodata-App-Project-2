
"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"
import { FarmSetup } from "./farm-setup"
import { DailyTracking } from "./daily-tracking"
import { PerformanceCalculator } from "./performance-calculator"
import type { FarmData, DailyRecord } from "@/types/calculator"
import { supabase } from "@/lib/supabase"

interface BroilerCalculatorProps {
  initialBuildingNumber?: number
  initialCycleNumber?: number
  buildingId?: string
  buildingName?: string
  onSaveFarmSetup?: () => void
}

export function BroilerCalculator({ 
  initialBuildingNumber, 
  initialCycleNumber, 
  buildingId,
  buildingName,
  onSaveFarmSetup 
}: BroilerCalculatorProps = {}) {
  const [farmData, setFarmData] = useState<FarmData>({
    volumeDelivered: undefined,
    deadOnArrival: undefined,
    shortCount: undefined,
    reject: undefined,
    totalBegInv: undefined,
    initialGrams: undefined,
    building: initialBuildingNumber ?? undefined,
    drNo: "",
    docSource: "",
    feeds: "",
    batchStartDate: new Date().toISOString().split('T')[0],
    targetWeight: undefined,
    targetAge: undefined,
  })

  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [farmId, setFarmId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'setup' | 'tracking' | 'performance input'>('setup')
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)

  useEffect(() => {
    console.log('BroilerCalculator buildingId:', buildingId);
    // Reset the initial data load flag when building changes
    setHasLoadedInitialData(false)
  }, [buildingId]);

  // Get farm ID from building
  useEffect(() => {
    if (!buildingId) {
      console.warn('No buildingId provided to BroilerCalculator');
      return;
    }

    const getFarmId = async () => {
      try {
        // OPTIMIZATION: Check cache first
        const cacheKey = `farm_id_${buildingId}`
        const cachedFarmId = sessionStorage.getItem(cacheKey)
        if (cachedFarmId) {
          console.log('Using cached farm_id:', cachedFarmId);
          setFarmId(cachedFarmId)
          return
        }

        console.log('Fetching farm_id for building:', buildingId);
        const { data, error } = await supabase
          .from('buildings')
          .select('farm_id')
          .eq('id', buildingId)
          .single()

        if (error) {
          console.error('Error fetching building:', error);
          alert(`Error: Could not find building with ID ${buildingId}. Please check if the building exists.`);
          return;
        }

        if (!data) {
          console.error('No building data returned for id:', buildingId);
          alert(`Error: No building found with ID ${buildingId}.`);
          return;
        }

        if (data.farm_id) {
          // OPTIMIZATION: Skip farm verification for cached data
          console.log('Successfully set farmId:', data.farm_id);
          setFarmId(data.farm_id)
          // Cache the farm ID
          sessionStorage.setItem(cacheKey, data.farm_id)
        } else {
          console.error('Building has no farm_id:', buildingId);
          alert('Error: This building is not associated with a farm. Please contact support.');
        }
      } catch (error) {
        console.error('Error loading building data:', error)
        alert('Error loading building data. Please try again.')
      }
    }

    getFarmId()
  }, [buildingId])

  // Load existing data function - moved outside useEffect for reusability
  const loadData = async (forceRefresh = false) => {
    console.log('🔄 [LOAD DATA] Starting loadData with farmId:', farmId, 'buildingId:', buildingId)
    
    if (!buildingId) {
      console.log('⏸️ [LOAD DATA] No buildingId available, skipping load')
      return
    }
    
    if (!farmId) {
      console.log('⏸️ [LOAD DATA] No farmId available yet, will retry when farmId is loaded')
      return
    }
    
    console.log('✅ [LOAD DATA] Both farmId and buildingId available, proceeding with data load')
    setLoading(true)
      
      // OPTIMIZATION: Check cache first (unless force refresh is requested)
      const cacheKey = `calculator_data_${buildingId}`
      const cachedData = sessionStorage.getItem(cacheKey)
      const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`)
      const now = Date.now()
      const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp) : Infinity
      const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes cache

      if (!forceRefresh && cachedData && cacheAge < CACHE_DURATION) {
        try {
          console.log('💾 [CACHE HIT] Using cached data for building:', buildingId, '(age:', Math.round(cacheAge / 1000), 'seconds)')
          const parsedData = JSON.parse(cachedData)
          setFarmData(parsedData.farmData || farmData)
          setDailyRecords(parsedData.dailyRecords || [])
          console.log('✅ [CACHE SUCCESS] Loaded', parsedData.dailyRecords?.length || 0, 'records from cache')
          setLoading(false)
          return
        } catch (error) {
          console.error('❌ [CACHE ERROR] Error parsing cached data:', error)
          // Continue with fresh data load
        }
      } else if (forceRefresh) {
        console.log('🔄 [FORCE REFRESH] Bypassing cache and fetching fresh data from database')
      } else if (cachedData) {
        console.log('💾 [CACHE EXPIRED] Cache expired for building:', buildingId, '(age:', Math.round(cacheAge / 1000), 'seconds)')
      } else {
        console.log('💾 [CACHE MISS] No cached data found for building:', buildingId)
      }

      // First, clear any sessions with default/empty values (only if not cached)
      if (!cachedData) {
        try {
          const { data: existingSessions, error: sessionsError } = await supabase
            .from('calculator_sessions')
            .select('*')
            .eq('building_id', buildingId)
            .eq('is_active', true)

          if (!sessionsError && existingSessions && existingSessions.length > 0) {
            for (const session of existingSessions) {
              const farmData = session.farm_data
              const hasOnlyDefaults = farmData && (
                (farmData.volumeDelivered === 0 || farmData.volumeDelivered === undefined) &&
                (farmData.deadOnArrival === 0 || farmData.deadOnArrival === undefined) &&
                (farmData.shortCount === 0 || farmData.shortCount === undefined) &&
                (farmData.reject === 0 || farmData.reject === undefined) &&
                (farmData.initialGrams === 0 || farmData.initialGrams === undefined) &&
                (farmData.building === 0 || farmData.building === undefined)
              )
              
              if (hasOnlyDefaults) {
                console.log('Clearing session with default values:', session.id)
                await supabase
                  .from('calculator_sessions')
                  .delete()
                  .eq('id', session.id)
              }
            }
          }
        } catch (error) {
          console.error('Error clearing default sessions:', error)
        }
      }
      try {
        // OPTIMIZATION: Parallel queries instead of sequential
        console.log('📥 [SUPABASE SELECT] Loading data for building:', buildingId)
        const [sessionResult, recordsResult] = await Promise.allSettled([
          supabase
            .from('calculator_sessions')
            .select('*')
            .eq('building_id', buildingId)
            .eq('is_active', true)
            .single(),
          supabase
            .from('daily_records')
            .select('*')
            .eq('building_id', buildingId)
            .order('date', { ascending: true })
        ])

        // Process session data
        if (sessionResult.status === 'fulfilled' && !sessionResult.value.error && sessionResult.value.data) {
          console.log('✅ [SUPABASE SELECT SUCCESS] Loaded calculator session:', sessionResult.value.data.id)
          setFarmData(sessionResult.value.data.farm_data)
        } else if (sessionResult.status === 'fulfilled' && sessionResult.value.error) {
          console.log('ℹ️ [SUPABASE SELECT INFO] No active calculator session found for building:', buildingId)
        }

        // Process records data
        if (recordsResult.status === 'fulfilled' && !recordsResult.value.error && recordsResult.value.data) {
          console.log('✅ [SUPABASE SELECT SUCCESS] Loaded', recordsResult.value.data.length, 'daily records')
          console.log('📊 [SUPABASE SELECT SUCCESS] Records summary:', recordsResult.value.data.map(r => ({ id: r.id, date: r.date, age: r.age })))
          console.log('🔍 [DEBUG] Full records data from database:', recordsResult.value.data)
          // Map database field names to TypeScript interface
          const mappedRecords = recordsResult.value.data.map(record => ({
            date: record.date,
            age: record.age,
            dailyFeeds: record.daily_feeds,
            cumulativeFeeds: record.cumulative_feeds,
            feedsDelivery: record.feeds_delivery,
            remainingFeeds: record.remaining_feeds,
            dailyMortality: record.daily_mortality,
            cumulativeMortality: record.cumulative_mortality,
            mortalityPercent: record.mortality_percent,
            endingHeads: record.ending_heads,
            alw: record.alw,
            adg: record.adg,
            remarks: record.remarks,
            mortalityImage: record.mortality_image
          }))
          setDailyRecords(mappedRecords)

          // OPTIMIZATION: Cache the loaded data
          const dataToCache = {
            farmData: sessionResult.status === 'fulfilled' && !sessionResult.value.error && sessionResult.value.data 
              ? sessionResult.value.data.farm_data 
              : farmData,
            dailyRecords: mappedRecords
          }
          console.log('💾 [CACHE] Caching data for building:', buildingId)
          sessionStorage.setItem(cacheKey, JSON.stringify(dataToCache))
          sessionStorage.setItem(`${cacheKey}_timestamp`, now.toString())
          console.log('✅ [CACHE SUCCESS] Data cached successfully')
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
  }

  // Load existing data when farmId and buildingId are available
  useEffect(() => {
    console.log('🔄 [USE EFFECT] loadData useEffect triggered with farmId:', farmId, 'buildingId:', buildingId)
    if (farmId && buildingId && !hasLoadedInitialData) {
      console.log('🔄 [INITIAL LOAD] First time loading data, forcing refresh to bypass cache')
      loadData(true) // Force refresh on initial load
      setHasLoadedInitialData(true)
    } else if (farmId && buildingId && hasLoadedInitialData) {
      console.log('🔄 [SUBSEQUENT LOAD] Loading data with cache')
      loadData()
    }
  }, [farmId, buildingId, hasLoadedInitialData])

  // Check if farm setup is complete
  const isFarmSetupComplete = () => {
    return farmData.volumeDelivered && 
           farmData.totalBegInv && 
           farmData.initialGrams && 
           farmData.building && 
           farmData.drNo && 
           farmData.batchStartDate
  }

  const handleTabChange = (value: string) => {
    if (value === 'tracking' && !isFarmSetupComplete()) {
      alert('Please complete the Loading Detail Setup first before proceeding to Daily Tracking.')
      return
    }
    if (value === 'performance' && !isFarmSetupComplete()) {
      alert('Please complete the Loading Detail Setup first before proceeding to Performance.')
      return
    }
    setActiveTab(value as 'setup' | 'tracking' | 'performance input')
  }

  // Save handlers
  const handleSaveFarmSetup = async () => {
    if (!farmId) {
      alert('Farm ID is not available. Please wait for the system to load the farm information, or contact support if this issue persists.')
      return
    }
    if (!buildingId) {
      alert('Building ID is not available. Please contact support.')
      return
    }

    // Verify farm exists before saving
    try {
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('id')
        .eq('id', farmId)
        .single()

      if (farmError || !farmData) {
        alert('Error: The farm does not exist. Please contact support.')
        return
      }
    } catch (error) {
      console.error('Error verifying farm:', error)
      alert('Error verifying farm. Please try again.')
      return
    }

    setLoading(true)
    try {
      // First, deactivate any existing active sessions for this building
      console.log('🔄 [SUPABASE UPDATE] Deactivating existing sessions for building:', buildingId)
      const { error: deactivateError } = await supabase
        .from('calculator_sessions')
        .update({ is_active: false })
        .eq('building_id', buildingId)
        .eq('is_active', true)

      if (deactivateError) {
        console.error('❌ [SUPABASE UPDATE ERROR] Failed to deactivate existing sessions:', deactivateError)
      } else {
        console.log('✅ [SUPABASE UPDATE SUCCESS] Successfully deactivated existing sessions')
      }

      // Create new active session with farm data for this building
      console.log('📝 [SUPABASE INSERT] Creating new calculator session for building:', buildingId)
      console.log('📋 [SUPABASE INSERT] Farm data to save:', {
        building: farmData.building,
        drNo: farmData.drNo,
        volumeDelivered: farmData.volumeDelivered,
        totalBegInv: farmData.totalBegInv,
        initialGrams: farmData.initialGrams
      })

      const { data, error } = await supabase
        .from('calculator_sessions')
        .insert([{
          farm_id: farmId,
          building_id: buildingId,
          session_name: `Building ${farmData.building} - ${farmData.drNo}`,
          farm_data: farmData,
          is_active: true,
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error('❌ [SUPABASE INSERT ERROR] Failed to save farm setup:', error)
        alert('Failed to save farm setup. Please try again.')
      } else {
        console.log('✅ [SUPABASE INSERT SUCCESS] Farm setup saved successfully:', data)
        console.log('📊 [SUPABASE INSERT SUCCESS] Created session with ID:', data?.[0]?.id)
        
        // Farm setup saved successfully - stay on page
        // OPTIMIZATION: Invalidate cache after save
        if (buildingId) {
          console.log('🗑️ [CACHE] Invalidating cache for building:', buildingId)
          sessionStorage.removeItem(`calculator_data_${buildingId}`)
          sessionStorage.removeItem(`calculator_data_${buildingId}_timestamp`)
          sessionStorage.removeItem(`farm_id_${buildingId}`)
          console.log('✅ [CACHE] Farm setup cache invalidated successfully')
        }
        onSaveFarmSetup?.()
      }
    } catch (error) {
      console.error('Error saving farm setup:', error)
      alert('Failed to save farm setup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDailyRecords = async (recordsToSave?: DailyRecord[]) => {
    const records = recordsToSave || dailyRecords
    console.log('🚀 [SAVE DAILY RECORDS] Starting save operation...')
    console.log('🔍 [SAVE DAILY RECORDS] Farm ID:', farmId, 'Building ID:', buildingId)
    console.log('📊 [SAVE DAILY RECORDS] Records to save:', records.length, 'records')
    console.log('🔍 [SAVE DAILY RECORDS] Using records from:', recordsToSave ? 'parameter' : 'state')
    
    if (!farmId) {
      console.error('❌ [SAVE DAILY RECORDS ERROR] No farm ID available')
      alert('Farm ID is not available. Please wait for the system to load the farm information, or contact support if this issue persists.')
      return
    }
    if (!buildingId) {
      console.error('❌ [SAVE DAILY RECORDS ERROR] No building ID available')
      alert('Building ID is not available. Please contact support.')
      return
    }

    // Verify farm exists before saving
    try {
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('id')
        .eq('id', farmId)
        .single()

      if (farmError || !farmData) {
        alert('Error: The farm does not exist. Please contact support.')
        return
      }
    } catch (error) {
      console.error('Error verifying farm:', error)
      alert('Error verifying farm. Please try again.')
      return
    }

    // Check for duplicate dates in the records array
    const dates = records.map(record => record.date)
    const duplicateDates = dates.filter((date, index) => dates.indexOf(date) !== index)
    if (duplicateDates.length > 0) {
      alert(`Duplicate dates found: ${duplicateDates.join(', ')}. Please remove duplicate records before saving.`)
      return
    }

    setLoading(true)
    try {
      // First, delete all existing records for this building to handle deletions properly
      console.log('🗑️ [SUPABASE DELETE] Starting deletion of all records for building:', buildingId)
      console.log('🔍 [DEBUG] Current records state before delete:', records.map(r => ({ date: r.date, age: r.age })))
      
      const { data: existingRecords, error: fetchError } = await supabase
        .from('daily_records')
        .select('id, date, age')
        .eq('building_id', buildingId)
      
      if (fetchError) {
        console.error('❌ [SUPABASE ERROR] Failed to fetch existing records:', fetchError)
      } else {
        console.log('📊 [SUPABASE INFO] Found', existingRecords?.length || 0, 'existing records to delete:', existingRecords)
        console.log('🔍 [DEBUG] Records in database vs UI state:')
        console.log('  - Database records:', existingRecords?.map(r => `${r.date} (age ${r.age})`))
        console.log('  - UI records:', records.map(r => `${r.date} (age ${r.age})`))
      }

      const { error: deleteError } = await supabase
        .from('daily_records')
        .delete()
        .eq('building_id', buildingId)

      if (deleteError) {
        console.error('❌ [SUPABASE DELETE ERROR] Failed to delete existing records:', deleteError)
        throw deleteError
      }

      console.log('✅ [SUPABASE DELETE SUCCESS] Successfully deleted all existing records for building:', buildingId)
      
      // Verify deletion by checking if any records still exist
      const { data: remainingRecords, error: verifyError } = await supabase
        .from('daily_records')
        .select('id, date, age')
        .eq('building_id', buildingId)
      
      if (verifyError) {
        console.error('❌ [SUPABASE VERIFY ERROR] Failed to verify deletion:', verifyError)
      } else {
        console.log('🔍 [VERIFY] Records remaining after delete:', remainingRecords?.length || 0)
        if (remainingRecords && remainingRecords.length > 0) {
          console.error('❌ [VERIFY FAILED] Some records were not deleted:', remainingRecords)
        } else {
          console.log('✅ [VERIFY SUCCESS] All records successfully deleted')
        }
      }

      // Then insert the current records (this handles both additions and updates)
      if (records.length > 0) {
        console.log('📝 [SUPABASE INSERT] Preparing to insert', records.length, 'records for building:', buildingId)
        
        const recordsToInsert = records.map((record, index) => {
          const recordData = {
            farm_id: farmId,
            building_id: buildingId,
            date: record.date,
            age: record.age,
            daily_feeds: record.dailyFeeds,
            cumulative_feeds: record.cumulativeFeeds,
            feeds_delivery: record.feedsDelivery,
            remaining_feeds: record.remainingFeeds,
            daily_mortality: record.dailyMortality,
            cumulative_mortality: record.cumulativeMortality,
            mortality_percent: record.mortalityPercent,
            ending_heads: record.endingHeads,
            alw: record.alw,
            adg: record.adg,
            remarks: record.remarks,
            mortality_image: record.mortalityImage,
            updated_at: new Date().toISOString()
          }
          console.log(`📋 [SUPABASE INSERT] Record ${index + 1}:`, {
            date: recordData.date,
            age: recordData.age,
            daily_feeds: recordData.daily_feeds,
            daily_mortality: recordData.daily_mortality,
            alw: recordData.alw
          })
          return recordData
        })

        console.log('🚀 [SUPABASE INSERT] Executing insert operation...')
        const { data, error } = await supabase
          .from('daily_records')
          .insert(recordsToInsert)
          .select()

        if (error) {
          console.error('❌ [SUPABASE INSERT ERROR] Failed to insert daily records:', error)
          console.error('🔍 [SUPABASE INSERT ERROR] Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          
          // Handle specific database constraint violations
          if (error.code === '23505') { // Unique constraint violation
            console.error('❌ [UNIQUE CONSTRAINT] Duplicate date detected in database')
            throw new Error('A record for this date already exists in the database. Please refresh the page and try again.')
          } else if (error.code === '23503') { // Foreign key constraint violation
            console.error('❌ [FOREIGN KEY] Invalid farm_id or building_id')
            throw new Error('Invalid farm or building reference. Please refresh the page and try again.')
          } else if (error.code === '23514') { // Check constraint violation
            console.error('❌ [CHECK CONSTRAINT] Invalid data values')
            throw new Error('Invalid data values detected. Please check your input and try again.')
          }
          
          throw error
        } else if (!data || data.length === 0) {
          console.error('❌ [SUPABASE INSERT ERROR] No data returned from insert operation')
          throw new Error('Insert operation returned no data')
        } else {
          console.log('✅ [SUPABASE INSERT SUCCESS] Successfully inserted', data?.length || 0, 'records:', data)
          console.log('📊 [SUPABASE INSERT SUCCESS] Inserted records summary:', data?.map(r => ({ id: r.id, date: r.date, age: r.age })))
          
          // Final verification - check what's actually in the database now
          const { data: finalRecords, error: finalError } = await supabase
            .from('daily_records')
            .select('id, date, age')
            .eq('building_id', buildingId)
            .order('date', { ascending: true })
          
          if (finalError) {
            console.error('❌ [FINAL VERIFY ERROR] Failed to verify final state:', finalError)
          } else {
            console.log('🔍 [FINAL VERIFY] Final database state:', finalRecords?.length || 0, 'records')
            console.log('📊 [FINAL VERIFY] Final records:', finalRecords?.map(r => `${r.date} (age ${r.age})`))
          }
        }
      } else {
        console.log('ℹ️ [SUPABASE INFO] No records to insert (all records were deleted)')
      }

      // OPTIMIZATION: Invalidate cache after save
      if (buildingId) {
        console.log('🗑️ [CACHE] Invalidating cache after save for building:', buildingId)
        sessionStorage.removeItem(`calculator_data_${buildingId}`)
        sessionStorage.removeItem(`calculator_data_${buildingId}_timestamp`)
        // Also clear any farm ID cache
        sessionStorage.removeItem(`farm_id_${buildingId}`)
        console.log('✅ [CACHE] Cache invalidated successfully')
      }

      // IMPORTANT: Wait a moment for database to fully commit
      console.log('⏳ [DELAY] Waiting for database commit...')
      await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
      
      // Only refresh if there was an error or if we need to sync with database
      console.log('✅ [SUCCESS] Database operation completed successfully - UI state is already correct')
      console.log('🎉 [SAVE DAILY RECORDS SUCCESS] All operations completed successfully')
      
    } catch (error) {
      console.error('❌ [SAVE DAILY RECORDS ERROR] Error saving daily records:', error)
      console.error('🔍 [SAVE DAILY RECORDS ERROR] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      alert(`Failed to save daily records: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state if we don't have the required IDs yet
  if (!farmId && buildingId) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Calculator className="w-8 h-8 text-blue-600" />
            Loading Details
          </h2>
          <p className="text-gray-600">Comprehensive farm management and performance tracking</p>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Loading farm information...</p>
          {/* Skeleton loading for better UX */}
          <div className="space-y-3 max-w-md mx-auto">
            <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if no buildingId is provided
  if (!buildingId) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Calculator className="w-8 h-8 text-blue-600" />
            Loading Details
          </h2>
          <p className="text-gray-600">Comprehensive farm management and performance tracking</p>
        </div>
        <div className="p-8 text-center">
          <p className="text-red-600 mb-4">Error: No building selected. Please select a building to continue.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          Loading Details
        </h2>
        <p className="text-sm sm:text-base text-gray-600">Comprehensive farm management and performance tracking</p>
      </div>
      
      {/* Show loading state while data is being fetched */}
      {loading && (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading data...</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-0">
          <TabsTrigger value="setup" className="text-xs sm:text-sm">Loading Detail Setup</TabsTrigger>
          <TabsTrigger 
            value="tracking" 
            disabled={!isFarmSetupComplete()}
            className={`text-xs sm:text-sm ${!isFarmSetupComplete() ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Daily Tracking
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            disabled={!isFarmSetupComplete()}
            className={`text-xs sm:text-sm ${!isFarmSetupComplete() ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Performance
          </TabsTrigger>
        </TabsList>
        <TabsContent value="setup">
          <FarmSetup
            farmData={farmData}
            setFarmData={setFarmData}
            onSave={handleSaveFarmSetup}
            loading={loading}
          />
        </TabsContent>
        <TabsContent value="tracking">
          {isFarmSetupComplete() ? (
            <DailyTracking
              farmData={farmData}
              dailyRecords={dailyRecords}
              setDailyRecords={setDailyRecords}
              onSave={handleSaveDailyRecords}
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">Please complete the Loading Detail Setup first.</p>
              <Button onClick={() => setActiveTab('setup')}>
                Go to Loading Detail Setup
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="performance">
          {isFarmSetupComplete() ? (
            <PerformanceCalculator 
              farmId={farmId || undefined}
              buildingId={buildingId || undefined}
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">Please complete the Loading Detail Setup first.</p>
              <Button onClick={() => setActiveTab('setup')}>
                Go to Loading Detail Setup
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}