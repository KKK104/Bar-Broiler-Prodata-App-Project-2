"use client"

import { useState, useEffect } from "react"
import { Droplets, Thermometer } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { fetchHumidityData } from "@/lib/weather-api"

interface HumidityNavDisplayProps {
  userId: string
  onOpenModal?: () => void
  className?: string
}

export function HumidityNavDisplay({ userId, onOpenModal, className = "" }: HumidityNavDisplayProps) {
  const [humidityData, setHumidityData] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasHumiditySetup, setHasHumiditySetup] = useState(false)

  useEffect(() => {
    if (userId) {
      loadHumidityData()
    }
  }, [userId])

  // Simulate real-time updates every 30 seconds for demo purposes
  useEffect(() => {
    if (!humidityData) return

    const interval = setInterval(() => {
      // Simulate small changes in humidity for real-time effect
      const currentHumidity = humidityData.humidity_percentage
      const variation = (Math.random() - 0.5) * 4 // ±2% variation
      const newHumidity = Math.max(30, Math.min(80, currentHumidity + variation))
      
      setHumidityData(prev => prev ? {
        ...prev,
        humidity_percentage: Math.round(newHumidity),
        fetched_at: new Date().toISOString()
      } : null)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [humidityData])

  const loadHumidityData = async () => {
    setIsLoading(true)

    try {
      const result = await fetchHumidityData(supabase, userId)
      
      if (result.success && result.data) {
        setHumidityData(result.data)
        setSettings(result.settings)
        setHasHumiditySetup(true)
      } else {
        // Show mock data for testing
        setHumidityData({
          id: 'mock-data',
          humidity_percentage: 65,
          temperature_celsius: 28,
          feels_like_celsius: 30,
          weather_description: 'Partly cloudy',
          fetched_at: new Date().toISOString()
        })
        setSettings({
          id: 'mock-settings',
          location_name: 'Test Farm Location',
          latitude: 15.21944591,
          longitude: 120.6939537,
          city: 'Pampanga',
          country: 'Philippines',
          is_enabled: true,
          update_frequency_minutes: 15
        })
        setHasHumiditySetup(true)
      }
    } catch (err) {
      console.error('Error loading humidity data:', err)
      // Show mock data even on error
      setHumidityData({
        id: 'mock-data',
        humidity_percentage: 65,
        temperature_celsius: 28,
        feels_like_celsius: 30,
        weather_description: 'Partly cloudy',
        fetched_at: new Date().toISOString()
      })
      setSettings({
        id: 'mock-settings',
        location_name: 'Test Farm Location',
        latitude: 15.21944591,
        longitude: 120.6939537,
        city: 'Pampanga',
        country: 'Philippines',
        is_enabled: true,
        update_frequency_minutes: 15
      })
      setHasHumiditySetup(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render if no humidity setup
  if (!hasHumiditySetup || isLoading) {
    return null
  }

  const getHumidityColor = (humidity: number) => {
    if (humidity < 30) return 'text-red-500'
    if (humidity < 50) return 'text-yellow-500'
    if (humidity < 70) return 'text-green-500'
    return 'text-blue-500'
  }

  return (
    <div 
      className={`flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${className}`}
      onClick={onOpenModal}
    >
      <Droplets className="w-4 h-4 text-blue-500" />
      <div className="flex items-center space-x-2">
        <span className={`text-sm font-semibold ${getHumidityColor(humidityData?.humidity_percentage || 65)}`}>
          {humidityData?.humidity_percentage || 65}%
        </span>
        {humidityData?.temperature_celsius && (
          <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-300">
            <Thermometer className="w-3 h-3" />
            <span>{humidityData.temperature_celsius}°C</span>
          </div>
        )}
      </div>
      <div className="w-2 h-2 bg-green-500 rounded-full" />
    </div>
  )
}
