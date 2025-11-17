import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { FarmData, DailyRecord, CalculatorSession, PerformanceMetrics } from '@/types/calculator'

export function useCalculatorData(farmId: string) {
  const [farmData, setFarmData] = useState<FarmData>({
    volumeDelivered: undefined,
    deadOnArrival: undefined,
    shortCount: undefined,
    reject: undefined,
    totalBegInv: undefined,
    initialGrams: undefined,
    building: undefined,
    drNo: "",
    docSource: "",
    feeds: "",
    batchStartDate: new Date().toISOString().split('T')[0],
    targetWeight: undefined,
    targetAge: undefined
  })

  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([])
  const [sessions, setSessions] = useState<CalculatorSession[]>([])
  const [currentSession, setCurrentSession] = useState<CalculatorSession | null>(null)
  const [loading, setLoading] = useState(false)

  const saveFarmData = async (data: FarmData, buildingId: string) => {
    if (!farmId || !buildingId) return { success: false, error: 'No farm or building ID' }

    console.log('🔧 Saving farm data:', data, 'for building:', buildingId)
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('calculator_sessions')
        .upsert([{
          farm_id: farmId,
          building_id: buildingId,
          session_name: `Batch ${data.building} - ${data.drNo}`,
          farm_data: data,
          is_active: true,
          updated_at: new Date().toISOString()
        }])

      if (error) {
        console.error('❌ Error saving farm data:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Farm data saved successfully')
      setFarmData(data)
      return { success: true }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      return { success: false, error: 'Failed to save farm data' }
    } finally {
      setLoading(false)
    }
  }

  const saveDailyRecord = async (record: DailyRecord, buildingId: string) => {
    if (!farmId || !buildingId) return { success: false, error: 'No farm or building ID' }

    console.log('🔧 Saving daily record:', record, 'for building:', buildingId)
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('daily_records')
        .upsert([{
          farm_id: farmId,
          building_id: buildingId,
          ...record,
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error('❌ Error saving daily record:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Daily record saved:', data)
      
      const updatedRecords = [...dailyRecords]
      const existingIndex = updatedRecords.findIndex(r => r.date === record.date)
      
      if (existingIndex >= 0) {
        updatedRecords[existingIndex] = record
      } else {
        updatedRecords.push(record)
        updatedRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }
      
      setDailyRecords(updatedRecords)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      return { success: false, error: 'Failed to save daily record' }
    } finally {
      setLoading(false)
    }
  }

  const loadCalculatorData = async () => {
    if (!farmId) return

    console.log('🔧 Loading calculator data for farm:', farmId)
    setLoading(true)
    
    try {
      // Load active session
      const { data: sessionData, error: sessionError } = await supabase
        .from('calculator_sessions')
        .select('*')
        .eq('farm_id', farmId)
        .eq('is_active', true)
        .single()

      if (!sessionError && sessionData) {
        console.log('✅ Active session loaded:', sessionData)
        setCurrentSession(sessionData)
        setFarmData(sessionData.farm_data)
      }

      // Load daily records
      const { data: recordsData, error: recordsError } = await supabase
        .from('daily_records')
        .select('*')
        .eq('farm_id', farmId)
        .order('date', { ascending: true })

      if (!recordsError && recordsData) {
        console.log('✅ Daily records loaded:', recordsData.length, 'records')
        setDailyRecords(recordsData)
      }

      // Load all sessions
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('calculator_sessions')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false })

      if (!allSessionsError && allSessions) {
        setSessions(allSessions)
      }

    } catch (error) {
      console.error('❌ Error loading calculator data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNewSession = async (sessionName: string) => {
    if (!farmId) return { success: false, error: 'No farm ID' }

    try {
      if (currentSession) {
        await supabase
          .from('calculator_sessions')
          .update({ is_active: false })
          .eq('id', currentSession.id)
      }

      const { data, error } = await supabase
        .from('calculator_sessions')
        .insert([{
          farm_id: farmId,
          session_name: sessionName,
          farm_data: {
            volumeDelivered: undefined,
            deadOnArrival: undefined,
            shortCount: undefined,
            reject: undefined,
            totalBegInv: undefined,
            initialGrams: undefined,
            building: undefined,
            drNo: "",
            docSource: "",
            feeds: "",
            batchStartDate: new Date().toISOString().split('T')[0]
          },
          is_active: true
        }])
        .select()

      if (error) {
        console.error('❌ Error creating new session:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ New session created:', data)
      
      setCurrentSession(data[0])
      setFarmData(data[0].farm_data)
      setDailyRecords([])
      
      return { success: true, data: data[0] }
    } catch (error) {
      console.error('❌ Unexpected error creating session:', error)
      return { success: false, error: 'Failed to create new session' }
    }
  }

  useEffect(() => {
    if (farmId) {
      loadCalculatorData()
    }
  }, [farmId])

  return {
    farmData,
    dailyRecords,
    sessions,
    currentSession,
    loading,
    setFarmData,
    setDailyRecords,
    saveFarmData,
    saveDailyRecord,
    createNewSession,
    loadCalculatorData
  }
}