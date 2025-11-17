import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface PerformanceStandard {
  id: string
  name: string
  mortality_rate: number
  fcr: number
  avg_weight: number
  adg: number
  is_custom: boolean
  farm_id?: string
  created_at?: string
}

// Built-in standard presets
const BUILT_IN_STANDARDS: PerformanceStandard[] = [
  {
    id: 'ross',
    name: 'Ross',
    mortality_rate: 5.8,
    fcr: 1.80,
    avg_weight: 2000,
    adg: 70,
    is_custom: false
  },
  {
    id: 'indian-river',
    name: 'Indian River',
    mortality_rate: 6.2,
    fcr: 1.85,
    avg_weight: 2050,
    adg: 68,
    is_custom: false
  },
  {
    id: 'arbor-acres',
    name: 'Arbor Acres',
    mortality_rate: 5.5,
    fcr: 1.78,
    avg_weight: 2080,
    adg: 72,
    is_custom: false
  },
  {
    id: 'cobb',
    name: 'Cobb',
    mortality_rate: 5.2,
    fcr: 1.75,
    avg_weight: 1950,
    adg: 68,
    is_custom: false
  }
]

export function usePerformanceStandards(farmId: string) {
  const [standards, setStandards] = useState<PerformanceStandard[]>(BUILT_IN_STANDARDS)
  const [selectedStandard, setSelectedStandard] = useState<PerformanceStandard>(BUILT_IN_STANDARDS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch custom standards from database
  const fetchCustomStandards = async () => {
    if (!farmId || farmId === "default-farm-id") {
      setStandards(BUILT_IN_STANDARDS)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('performance_standards')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching custom standards:', error)
        setError(error.message)
        return
      }

      // Combine built-in standards with custom ones
      const customStandards: PerformanceStandard[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        mortality_rate: item.mortality_rate,
        fcr: item.fcr,
        avg_weight: item.avg_weight,
        adg: item.adg,
        is_custom: true,
        farm_id: item.farm_id,
        created_at: item.created_at
      }))

      setStandards([...BUILT_IN_STANDARDS, ...customStandards])
    } catch (err) {
      console.error('Error fetching standards:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch standards')
    } finally {
      setLoading(false)
    }
  }

  // Add custom standard to database
  const addCustomStandard = async (standardData: {
    name: string
    mortality_rate: number
    fcr: number
    avg_weight: number
    adg: number
  }) => {
    if (!farmId || farmId === "default-farm-id") {
      throw new Error('Please set up a valid farm first')
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('performance_standards')
        .insert({
          farm_id: farmId,
          name: standardData.name,
          mortality_rate: standardData.mortality_rate,
          fcr: standardData.fcr,
          avg_weight: standardData.avg_weight,
          adg: standardData.adg
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding custom standard:', error)
        throw new Error(error.message)
      }

      // Refresh standards list
      await fetchCustomStandards()

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add custom standard'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Delete custom standard
  const deleteCustomStandard = async (standardId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('performance_standards')
        .delete()
        .eq('id', standardId)
        .eq('farm_id', farmId)

      if (error) {
        console.error('Error deleting custom standard:', error)
        throw new Error(error.message)
      }

      // Refresh standards list
      await fetchCustomStandards()

      // If deleted standard was selected, reset to first built-in standard
      if (selectedStandard.id === standardId) {
        setSelectedStandard(BUILT_IN_STANDARDS[0])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete standard'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomStandards()
  }, [farmId])

  return {
    standards,
    selectedStandard,
    setSelectedStandard,
    addCustomStandard,
    deleteCustomStandard,
    loading,
    error,
    refetch: fetchCustomStandards
  }
} 