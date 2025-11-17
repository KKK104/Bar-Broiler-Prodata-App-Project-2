"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Droplets, 
  MapPin, 
  Settings, 
  Trash2, 
  Edit, 
  Pause, 
  Play, 
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { LocationPickerModal } from "./LocationPickerModal"

interface HumiditySettings {
  id: string
  location_name: string
  latitude: number
  longitude: number
  city?: string
  country?: string
  is_enabled: boolean
  update_frequency_minutes: number
  last_updated?: string
}

interface HumidityData {
  id: string
  humidity_percentage: number
  temperature_celsius?: number
  feels_like_celsius?: number
  weather_description?: string
  fetched_at: string
}

interface HumidityModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  farmId: string
}

export function HumidityModal({ isOpen, onClose, userId, farmId }: HumidityModalProps) {
  const [settings, setSettings] = useState<HumiditySettings | null>(null)
  const [humidityData, setHumidityData] = useState<HumidityData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)


  // Load existing settings on mount
  useEffect(() => {
    if (isOpen && userId) {
      loadHumiditySettings()
    }
  }, [isOpen, userId])

  // Fallback to clear loading state after 5 seconds
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('Loading timeout - clearing loading state')
        setIsLoading(false)
      }, 5000)
      
      return () => clearTimeout(timeout)
    }
  }, [isLoading])

  const loadHumiditySettings = async () => {
    console.log('Loading humidity settings...')
    setIsLoading(true)
    setError(null)
    
    try {
      // Check if humidity_settings table exists
      const { data, error } = await supabase
        .from('humidity_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        // If table doesn't exist, show setup message instead of error
        if (error.message?.includes('relation "humidity_settings" does not exist')) {
          console.log('Humidity settings table not found. User needs to set up location first.')
          setSettings(null)
          return
        }
        throw error
      }

      if (data) {
        setSettings(data)
        loadHumidityData(data.id)
      } else {
        // No settings found, user needs to set up location
        setSettings(null)
      }
    } catch (err) {
      console.error('Error loading humidity settings:', err)
      // Don't show error if table doesn't exist, just show setup message
      if (err.message?.includes('relation "humidity_settings" does not exist')) {
        setSettings(null)
      } else {
        setError('Failed to load humidity settings')
      }
    } finally {
      console.log('Finished loading humidity settings, setting isLoading to false')
      setIsLoading(false)
    }
  }

  const loadHumidityData = async (settingId: string) => {
    try {
      const { data, error } = await supabase
        .from('humidity_data')
        .select('*')
        .eq('humidity_setting_id', settingId)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setHumidityData(data)
      }
    } catch (err) {
      console.error('Error loading humidity data:', err)
    }
  }

  const handleLocationSelect = async (location: {
    name: string
    latitude: number
    longitude: number
    city?: string
    country?: string
    address?: string
  }) => {
    setIsSaving(true)
    setError(null)

    try {
      const settingData = {
        user_id: userId,
        farm_id: farmId,
        location_name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city || null,
        country: location.country || null,
        is_enabled: true,
        update_frequency_minutes: 15
      }

      let result
      if (settings) {
        // Update existing settings
        result = await supabase
          .from('humidity_settings')
          .update(settingData)
          .eq('id', settings.id)
          .select()
          .single()
      } else {
        // Create new settings
        result = await supabase
          .from('humidity_settings')
          .insert(settingData)
          .select()
          .single()
      }

      if (result.error) throw result.error

      setSettings(result.data)
      setSuccess('Location saved successfully!')
      setShowLocationPicker(false)
      
      // Fetch initial humidity data
      await fetchInitialHumidityData(result.data.id)
    } catch (err) {
      console.error('Error saving location:', err)
      setError('Failed to save location')
    } finally {
      setIsSaving(false)
    }
  }

  const fetchInitialHumidityData = async (settingId: string) => {
    try {
      // Trigger initial data fetch
      const response = await fetch('/api/humidity/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ humiditySettingId: settingId }),
      })

      if (response.ok) {
        // Reload humidity data
        await loadHumidityData()
      }
    } catch (err) {
      console.error('Error fetching initial humidity data:', err)
    }
  }

  const handleToggleEnabled = async () => {
    if (!settings) return

    setIsSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('humidity_settings')
        .update({ is_enabled: !settings.is_enabled })
        .eq('id', settings.id)

      if (error) throw error

      setSettings(prev => prev ? { ...prev, is_enabled: !prev.is_enabled } : null)
      setSuccess(`Humidity updates ${!settings.is_enabled ? 'enabled' : 'disabled'}`)
    } catch (err) {
      console.error('Error toggling humidity settings:', err)
      setError('Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSettings = async () => {
    if (!settings) return

    if (!confirm('Are you sure you want to delete your humidity settings? This action cannot be undone.')) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('humidity_settings')
        .delete()
        .eq('id', settings.id)

      if (error) throw error

      setSettings(null)
      setHumidityData(null)
      setSuccess('Humidity settings deleted successfully')
    } catch (err) {
      console.error('Error deleting humidity settings:', err)
      setError('Failed to delete settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefreshData = async () => {
    if (!settings) return

    setIsLoading(true)
    setError(null)

    try {
      // This would trigger a server-side function to fetch new data
      // For now, we'll just reload the existing data
      await loadHumidityData(settings.id)
      setSuccess('Data refreshed successfully')
    } catch (err) {
      console.error('Error refreshing data:', err)
      setError('Failed to refresh data')
    } finally {
      setIsLoading(false)
    }
  }


  console.log('HumidityModal render - isOpen:', isOpen, 'userId:', userId, 'farmId:', farmId)
  
  if (!isOpen) {
    console.log('HumidityModal not rendering because isOpen is false')
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Humidity Monitoring</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">Monitor farm humidity levels</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-600 dark:text-green-400">{success}</p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600 dark:text-gray-300">Loading humidity data...</p>
              </div>
            )}

            {/* No Settings State */}
            {!isLoading && !settings && (
              <div className="text-center py-8">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Location Set</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Set up humidity monitoring for your farm location to track environmental conditions.
                </p>
                <Button onClick={() => setShowLocationPicker(true)}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </div>
            )}

            {/* Settings Display */}
            {!isLoading && settings && (
              <div className="space-y-4">
                {/* Current Settings Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Current Location</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{settings.location_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {settings.city && settings.country 
                            ? `${settings.city}, ${settings.country}` 
                            : `${settings.latitude}, ${settings.longitude}`
                          }
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${settings.is_enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {settings.is_enabled ? 'Updates enabled' : 'Updates paused'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Humidity Data Card */}
                {humidityData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Droplets className="w-5 h-5" />
                        <span>Current Conditions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {humidityData.humidity_percentage}%
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Humidity</p>
                        </div>
                        {humidityData.temperature_celsius && (
                          <div className="text-center">
                            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                              {humidityData.temperature_celsius}°C
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Temperature</p>
                          </div>
                        )}
                      </div>
                      {humidityData.weather_description && (
                        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">
                          {humidityData.weather_description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                        Last updated: {new Date(humidityData.fetched_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowLocationPicker(true)}
                    disabled={isSaving}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Location
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleToggleEnabled}
                    disabled={isSaving}
                  >
                    {settings.is_enabled ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Updates
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Enable Updates
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRefreshData}
                    disabled={isLoading || isSaving}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeleteSettings}
                    disabled={isSaving}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {/* Location Picker Modal */}
            <LocationPickerModal
              isOpen={showLocationPicker}
              onClose={() => setShowLocationPicker(false)}
              onLocationSelect={handleLocationSelect}
              existingLocation={settings ? {
                name: settings.location_name,
                latitude: settings.latitude,
                longitude: settings.longitude,
                city: settings.city,
                country: settings.country
              } : undefined}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
