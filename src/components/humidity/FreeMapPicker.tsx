"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Search, AlertCircle } from "lucide-react"

interface FreeMapPickerProps {
  onLocationSelect: (location: {
    name: string
    latitude: number
    longitude: number
    city?: string
    country?: string
    address?: string
  }) => void
  initialLocation?: {
    latitude: number
    longitude: number
  }
  className?: string
}

export function FreeMapPicker({ onLocationSelect, initialLocation, className = "" }: FreeMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number
    longitude: number
    address?: string
  } | null>(null)

  // Initialize map
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadLeafletMap()
    }

    // Cleanup function
    return () => {
      if (map) {
        try {
          map.remove()
        } catch (err) {
          console.log('Map already removed or not initialized')
        }
        setMap(null)
      }
      if (marker) {
        setMarker(null)
      }
      // Clear the container's leaflet ID
      if (mapRef.current && mapRef.current._leaflet_id) {
        delete mapRef.current._leaflet_id
      }
    }
  }, [])

  // Handle map re-initialization when component re-mounts
  useEffect(() => {
    if (mapRef.current && mapRef.current._leaflet_id && !map) {
      // Container has a map but our state doesn't, clear it
      delete mapRef.current._leaflet_id
    }
  }, [map])

  const loadLeafletMap = () => {
    if (!mapRef.current) return

    // Check if map is already initialized
    if (map) {
      console.log('Map already initialized, skipping...')
      return
    }

    // Load Leaflet CSS and JS dynamically
    const loadLeafletCSS = () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      }
    }

    const loadLeafletJS = () => {
      return new Promise((resolve, reject) => {
        if (window.L) {
          resolve(window.L)
          return
        }

        if (document.querySelector('script[src*="leaflet"]')) {
          // Script is already loading, wait for it
          const checkLeaflet = () => {
            if (window.L) {
              resolve(window.L)
            } else {
              setTimeout(checkLeaflet, 100)
            }
          }
          checkLeaflet()
          return
        }

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        script.crossOrigin = 'anonymous'
        script.onload = () => resolve(window.L)
        script.onerror = () => reject(new Error('Failed to load Leaflet'))
        document.head.appendChild(script)
      })
    }

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return

    // Check if map container already has a map instance
    if (mapRef.current._leaflet_id) {
      console.log('Map container already initialized, skipping...')
      return
    }

    // Check if we already have a map instance in state
    if (map) {
      console.log('Map already exists in state, skipping...')
      return
    }

    // Ensure we have valid coordinates
    const defaultCenter = initialLocation && 
      typeof initialLocation.latitude === 'number' && 
      typeof initialLocation.longitude === 'number' && 
      !isNaN(initialLocation.latitude) && 
      !isNaN(initialLocation.longitude)
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : { lat: 14.5995, lng: 120.9842 } // Default to Manila, Philippines
    
    let mapInstance
    try {
      mapInstance = window.L.map(mapRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: initialLocation ? 15 : 2,
        zoomControl: true
      })
    } catch (error) {
      console.error('Error initializing map:', error)
      setError('Failed to initialize map. Please try again.')
      return
    }

      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstance)

      setMap(mapInstance)

      // Add click listener to map
      mapInstance.on('click', (event: any) => {
        const lat = event.latlng.lat
        const lng = event.latlng.lng
        
        setSelectedLocation({ latitude: lat, longitude: lng })
        
        // Update marker position
        if (marker) {
          marker.setLatLng([lat, lng])
        } else {
          const newMarker = window.L.marker([lat, lng], {
            draggable: true
          }).addTo(mapInstance)
          setMarker(newMarker)
        }

        // Reverse geocode to get address
        reverseGeocode(lat, lng)
      })

      // Add initial marker if location is provided and valid
      if (initialLocation && 
          typeof initialLocation.latitude === 'number' && 
          typeof initialLocation.longitude === 'number' && 
          !isNaN(initialLocation.latitude) && 
          !isNaN(initialLocation.longitude)) {
        const initialMarker = window.L.marker([defaultCenter.lat, defaultCenter.lng], {
          draggable: true
        }).addTo(mapInstance)
        setMarker(initialMarker)
        setSelectedLocation({ latitude: defaultCenter.lat, longitude: defaultCenter.lng })
        reverseGeocode(defaultCenter.lat, defaultCenter.lng)
      }
    }

    // Load CSS and JS, then initialize
    loadLeafletCSS()
    loadLeafletJS()
      .then(() => {
        setTimeout(initializeMap, 100)
      })
      .catch((err) => {
        console.error('Error loading Leaflet:', err)
        setError('Failed to load map. Please check your internet connection.')
      })
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      
      if (response.ok) {
        const data = await response.json()
        const address = data.display_name
        setSelectedLocation(prev => prev ? { ...prev, address } : { latitude: lat, longitude: lng, address })
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      
      if (response.ok) {
        const results = await response.json()
        
        if (results.length > 0) {
          const result = results[0]
          const lat = parseFloat(result.lat)
          const lng = parseFloat(result.lon)
          
          // Update map center and zoom
          if (map) {
            map.setView([lat, lng], 15)
          }
          
          // Update marker
          if (marker) {
            marker.setLatLng([lat, lng])
          } else {
            const newMarker = window.L.marker([lat, lng], {
              draggable: true
            }).addTo(map)
            setMarker(newMarker)
          }
          
          setSelectedLocation({
            latitude: lat,
            longitude: lng,
            address: result.display_name
          })
        } else {
          setError('Location not found. Please try a different search term.')
        }
      } else {
        setError('Search failed. Please try again.')
      }
    } catch (err) {
      console.error('Search failed:', err)
      setError('Search failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmLocation = () => {
    if (!selectedLocation) return

    const locationName = searchQuery.trim() || selectedLocation.address || 
      `Location (${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)})`

    onLocationSelect({
      name: locationName,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      address: selectedLocation.address
    })
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        if (map) {
          map.setView([latitude, longitude], 15)
          
          if (marker) {
            marker.setLatLng([latitude, longitude])
          } else {
            const newMarker = window.L.marker([latitude, longitude], {
              draggable: true
            }).addTo(map)
            setMarker(newMarker)
          }
        }
        
        setSelectedLocation({ latitude, longitude })
        reverseGeocode(latitude, longitude)
        setIsLoading(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        let errorMessage = 'Failed to get current location. Please search manually.'
        
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
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="space-y-2">
        <Label htmlFor="map-search">Search for Location</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="map-search"
              placeholder="Search for city, address, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isLoading || !searchQuery.trim()}
            size="sm"
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Map Container */}
      <div className="space-y-2">
        <Label>Select Location on Map</Label>
        <div className="relative">
          <div 
            ref={mapRef} 
            className="w-full h-64 sm:h-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-center"
            style={{ minHeight: '256px' }}
          >
            {!map && (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Loading map...</p>
              </div>
            )}
          </div>
          
          {/* Map Controls */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGetCurrentLocation}
              disabled={isLoading}
              className="bg-white/90 hover:bg-white"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click on the map to select a location, or search for a specific address.
        </p>
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Selected Location
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {selectedLocation.address || `Coordinates: ${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleConfirmLocation}
          disabled={!selectedLocation}
          className="flex-1"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Confirm Location
        </Button>
      </div>
    </div>
  )
}
