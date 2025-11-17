import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Participant {
  id: string
  name: string
  access_tools: string[]
  code: string
  farm_id: string
  created_at: string
}

export interface Building {
  id: string
  name: string
  farm_id: string
  building_number?: number
  status: string
  cycle_number?: number
  cycle_start_date?: string
  created_at: string
}

export interface Farm {
  id: string
  name: string
  owner_id: string
  building_count: number
  created_at: string
}

// Hook for managing participants
export function useParticipants(farmId: string) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchParticipants = async () => {
    // Allow fetching even without farmId for staff login
    if (!farmId) {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching participants:', error)
        setError(error.message)
        return
      }

      setParticipants(data || [])
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Failed to fetch participants')
    } finally {
      setLoading(false)
    }
  }

  const addParticipant = async (participantData: {
    name: string
    access_tools: string[]
    code: string
  }) => {
    try {
      // Validate farm_id before inserting
      if (!farmId || farmId.trim() === '') {
        console.error('❌ Cannot add participant: farmId is empty or invalid');
        return { success: false, error: 'Invalid farm ID. Please refresh and try again.' };
      }

      // Verify farm exists before inserting participant
      const { data: farmExists, error: farmError } = await supabase
        .from('farms')
        .select('id')
        .eq('id', farmId)
        .single();

      if (farmError || !farmExists) {
        console.error('❌ Farm validation failed:', farmError);
        return { success: false, error: 'Farm not found. Please refresh and try again.' };
      }

      console.log('✅ Farm validated before participant creation:', farmId);

      const { data, error } = await supabase
        .from('participants')
        .insert([{
          farm_id: farmId,
          name: participantData.name,
          access_tools: participantData.access_tools,
          code: participantData.code
        }])
        .select()
        .single()

      if (error) {
        console.error('❌ Error adding participant:', error);
        return { success: false, error: error.message }
      }

      console.log('✅ Participant added successfully:', data);

      // Refresh the participants list
      await fetchParticipants()
      
      return { success: true, data }
    } catch (error) {
      console.error('❌ Unexpected error adding participant:', error);
      return { success: false, error: 'Failed to add participant' }
    }
  }

  const updateParticipant = async (
    id: string,
    updates: {
      name?: string
      access_tools?: string[]
      code?: string
    }
  ) => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) {
        return { success: false, error: error.message }
      }
      
      // Refresh the participants list
      await fetchParticipants()
      
      return { success: true, data: data?.[0] }
    } catch (err) {
      return { success: false, error: 'Failed to update participant' }
    }
  }

  const deleteParticipant = async (id: string) => {
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }
      
      // Refresh the participants list
      await fetchParticipants()
      
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to delete participant' }
    }
  }

  useEffect(() => {
    fetchParticipants()
  }, [farmId])

  return {
    participants,
    loading,
    error,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    refetch: fetchParticipants,
  }
}

// Hook for managing buildings - Safe version
export function useBuildings(farmId: string) {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBuildings = async () => {
    // Skip if no valid farm ID
    if (!farmId || farmId === "default-farm-id") {
      setBuildings([])
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching buildings for farmId:', farmId);

      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching buildings:', error.message)
        setError(error.message)
        setBuildings([])
      } else {
        setBuildings(data || [])
      }
      
    } catch (err) {
      console.error('Unexpected error fetching buildings:', err)
      setError('Failed to load buildings')
      setBuildings([])
    } finally {
      setLoading(false)
    }
  }

  const addBuilding = async (name: string, type?: string, capacity?: number, status?: string, cycleNumber?: number, cycleStartDate?: string, buildingNumber?: number) => {
    try {
      console.log('🔧 addBuilding called with farmId:', farmId);
      
      // Validate farm ID
      if (!farmId || farmId.trim() === '') {
        console.error('❌ No farm ID provided for building creation');
        return { success: false, error: 'No farm ID available. Please ensure you have a valid farm.' }
      }

      // Verify farm exists
      const { data: farmExists, error: farmCheckError } = await supabase
        .from('farms')
        .select('id')
        .eq('id', farmId)
        .single()

      if (farmCheckError || !farmExists) {
        console.log('❌ Farm not found, attempting to create farm:', farmId);
        
        // Try to create the farm if it doesn't exist
        // First, we need to get the user ID to create the farm
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error('❌ No authenticated user found');
          return { success: false, error: 'No authenticated user found. Please sign in again.' }
        }

        console.log('🏗️ Creating farm for user:', user.id);
        
        const { data: newFarm, error: createFarmError } = await supabase
          .from('farms')
          .insert([{
            id: farmId, // Use the expected farm ID
            name: 'My Farm',
            owner_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (createFarmError) {
          console.error('❌ Error creating farm:', createFarmError);
          return { success: false, error: `Failed to create farm: ${createFarmError.message}` }
        }

        console.log('✅ Farm created successfully:', newFarm);
      } else {
        console.log('✅ Farm verified:', farmId);
      }

      // First, check if building number already exists for this farm
      if (buildingNumber) {
        const { data: existingBuilding, error: checkError } = await supabase
          .from('buildings')
          .select('building_number')
          .eq('farm_id', farmId)
          .eq('building_number', buildingNumber)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking for duplicate building number:', checkError)
          return { success: false, error: 'Failed to check for duplicate building number' }
        }

        if (existingBuilding) {
          return { success: false, error: `Building number ${buildingNumber} is already in use for this farm` }
        }
      }

      const buildingData = {
        name,
        type: type || 'general',
        capacity: capacity || 0,
        farm_id: farmId,
        building_number: buildingNumber,
        status: status || 'active',
        cycle_number: cycleNumber,
        cycle_start_date: cycleStartDate
      }

      console.log('🏗️ Adding building with data:', buildingData)

      const { data, error } = await supabase
        .from('buildings')
        .insert([buildingData])
        .select()

      if (error) {
        console.error('❌ Error adding building:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Building added successfully:', data?.[0]);
      
      // Refresh the buildings list
      await fetchBuildings()
      
      return { success: true, data: data?.[0] }
    } catch (err) {
      console.error('❌ Unexpected error adding building:', err)
      return { success: false, error: 'Failed to add building' }
    }
  }

  const updateBuilding = async (
    id: string,
    updates: {
      name?: string
      status?: string
      cycle_number?: number
      cycle_start_date?: string
    }
  ) => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) {
        return { success: false, error: error.message }
      }
      
      // Refresh the buildings list
      await fetchBuildings()
      
      return { success: true, data: data?.[0] }
    } catch (err) {
      return { success: false, error: 'Failed to update building' }
    }
  }

  const deleteBuilding = async (id: string) => {
    try {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }
      
      // Refresh the buildings list
      await fetchBuildings()
      
      return { success: true }
    } catch (err) {
      return { success: false, error: 'Failed to delete building' }
    }
  }

  useEffect(() => {
    fetchBuildings()
  }, [farmId])

  return {
    buildings,
    loading,
    error,
    addBuilding,
    updateBuilding,
    deleteBuilding,
    refetch: fetchBuildings,
  }
}

