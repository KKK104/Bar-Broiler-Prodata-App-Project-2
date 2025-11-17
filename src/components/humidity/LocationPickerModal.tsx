"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MapPin, 
  Search, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Globe,
  Navigation,
  Map
} from "lucide-react"
import { FreeMapPicker } from "./FreeMapPicker"

interface LocationPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: {
    name: string
    latitude: number
    longitude: number
    city?: string
    country?: string
    address?: string
  }) => void
  existingLocation?: {
    name: string
    latitude: number
    longitude: number
    city?: string
    country?: string
  }
}

interface LocationSuggestion {
  name: string
  latitude: number
  longitude: number
  city?: string
  country?: string
  address?: string
}

export function LocationPickerModal({ 
  isOpen, 
  onClose, 
  onLocationSelect, 
  existingLocation 
}: LocationPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null)
  const [locationName, setLocationName] = useState("")
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectionMethod, setSelectionMethod] = useState<"search" | "map">("search")

  // Initialize with existing location if provided
  useEffect(() => {
    if (existingLocation) {
      setLocationName(existingLocation.name)
      setSelectedLocation({
        name: existingLocation.name,
        latitude: existingLocation.latitude,
        longitude: existingLocation.longitude,
        city: existingLocation.city,
        country: existingLocation.country
      })
    }
  }, [existingLocation])

  // Search for locations using a geocoding service
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      )
      
      if (!response.ok) {
        throw new Error('Failed to search locations')
      }

      const data = await response.json()
      
      const suggestions: LocationSuggestion[] = data.map((item: any) => ({
        name: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        city: item.address?.city || item.address?.town || item.address?.village,
        country: item.address?.country,
        address: item.display_name
      }))

      setSuggestions(suggestions)
    } catch (err) {
      console.error('Error searching locations:', err)
      setError('Failed to search locations. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    try {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser')
        return
      }

      setIsGettingCurrentLocation(true)
      setError(null)
    } catch (err) {
      console.error('Error initializing geolocation:', err)
      setError('Failed to access location services. Please search manually.')
      setIsGettingCurrentLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          )
          
          if (response.ok) {
            const data = await response.json()
            const address = data.display_name
            
            const location: LocationSuggestion = {
              name: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              latitude,
              longitude,
              city: data.address?.city || data.address?.town || data.address?.village,
              country: data.address?.country,
              address
            }
            
            setSelectedLocation(location)
            setLocationName(location.name)
          } else {
            // Fallback if reverse geocoding fails
            const location: LocationSuggestion = {
              name: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              latitude,
              longitude
            }
            
            setSelectedLocation(location)
            setLocationName(location.name)
          }
        } catch (err) {
          console.error('Error getting address:', err)
          // Still set the location even if reverse geocoding fails
          const location: LocationSuggestion = {
            name: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            latitude,
            longitude
          }
          
          setSelectedLocation(location)
          setLocationName(location.name)
        } finally {
          setIsGettingCurrentLocation(false)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        let errorMessage = 'Failed to get current location. Please try again or search manually.'
        
        // Provide more specific error messages
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions or search manually.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please search manually.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or search manually.'
            break
        }
        
        setError(errorMessage)
        setIsGettingCurrentLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchLocations(query)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  // Handle location selection
  const handleLocationSelect = (location: LocationSuggestion) => {
    setSelectedLocation(location)
    setLocationName(location.name)
    setSuggestions([])
    setSearchQuery("")
  }

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedLocation || !locationName.trim()) {
      setError('Please select a location and enter a name')
      return
    }

    onLocationSelect({
      name: locationName.trim(),
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      city: selectedLocation.city,
      country: selectedLocation.country,
      address: selectedLocation.address
    })
  }

  if (!isOpen) return null

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
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {existingLocation ? 'Edit Location' : 'Select Farm Location'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Choose a location for humidity monitoring
                </p>
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
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Location Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location Name *
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Main Farm, Building A, North Field"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Selection Method Tabs */}
            <div className="space-y-4">
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setSelectionMethod("search")}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectionMethod === "search"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
                <button
                  onClick={() => setSelectionMethod("map")}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectionMethod === "map"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Map className="w-4 h-4" />
                  <span>Map</span>
                </button>
              </div>

              {/* Tab Content */}
              {selectionMethod === "search" && (
                <div className="space-y-4">

            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search for Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search for city, address, or landmark..."
                  className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
            </div>

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Results</h3>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleLocationSelect(suggestion)}
                      className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {suggestion.city && suggestion.country 
                              ? `${suggestion.city}, ${suggestion.country}`
                              : suggestion.name
                            }
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {suggestion.latitude.toFixed(4)}, {suggestion.longitude.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

                  {/* Current Location Button */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={isGettingCurrentLocation}
                      className="flex-1"
                    >
                      {isGettingCurrentLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 h-4 mr-2" />
                          Use Current Location
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Map Picker Tab */}
              {selectionMethod === "map" && (
                <div className="space-y-4">
                  <FreeMapPicker
                    onLocationSelect={(location) => {
                      setSelectedLocation(location)
                      setLocationName(location.name)
                    }}
                    initialLocation={selectedLocation ? {
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude
                    } : undefined}
                  />
                </div>
              )}
            </div>

            {/* Selected Location Display */}
            {selectedLocation && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Selected Location
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {selectedLocation.city && selectedLocation.country 
                        ? `${selectedLocation.city}, ${selectedLocation.country}`
                        : `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
                      }
                    </p>
                    {selectedLocation.address && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {selectedLocation.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!selectedLocation || !locationName.trim()}
                className="flex-1"
              >
                {existingLocation ? 'Update Location' : 'Save Location'}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
