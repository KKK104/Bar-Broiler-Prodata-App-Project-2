"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Search, ZoomIn, ZoomOut, RotateCcw, AlertCircle } from "lucide-react"

interface MapPickerProps {
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

export function MapPicker({ onLocationSelect, initialLocation, className = "" }: MapPickerProps) {
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
    if (typeof window !== 'undefined' && window.google) {
      initializeMap()
    } else {
      // Load Google Maps API if not already loaded
      loadGoogleMapsAPI()
    }

    // Cleanup function to prevent DOM manipulation issues
    return () => {
      if (map) {
        // Clear map instance
        setMap(null)
      }
      if (marker) {
        // Clear marker
        setMarker(null)
      }
    }
  }, [])

  const loadGoogleMapsAPI = () => {
    if (typeof window === 'undefined') return

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap()
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Script is already loading, wait for it
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps) {
          initializeMap()
        } else {
          setTimeout(checkGoogleMaps, 100)
        }
      }
      checkGoogleMaps()
      return
    }

    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDheyG9_vnrzo7pIB9OrtMrLtrMWhi3QuE'
    console.log('Google Maps API Key:', apiKey ? 'Found' : 'Not found')
    console.log('API Key value:', apiKey)
    
    if (!apiKey || apiKey === 'undefined') {
      setError('Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.')
      return
    }

    try {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.id = 'google-maps-script'
      script.onload = () => {
        // Add a small delay to ensure Google Maps is fully initialized
        setTimeout(() => {
          if (window.google && window.google.maps) {
            initializeMap()
          }
        }, 100)
      }
      script.onerror = () => {
        setError('Failed to load Google Maps. Please check your API key and internet connection.')
      }
      
      // Only append if not already in DOM
      if (!document.getElementById('google-maps-script')) {
        document.head.appendChild(script)
      }
    } catch (err) {
      console.error('Error loading Google Maps script:', err)
      setError('Failed to load Google Maps script.')
    }
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.google || map) return

    const defaultCenter = initialLocation || { lat: 0, lng: 0 }
    
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: initialLocation ? 15 : 2,
      center: defaultCenter,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    })

    setMap(mapInstance)

    // Add click listener to map
    mapInstance.addListener('click', (event: any) => {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      
      setSelectedLocation({ latitude: lat, longitude: lng })
      
      // Update marker position
      if (marker) {
        marker.setPosition(event.latLng)
      } else {
        const newMarker = new window.google.maps.Marker({
          position: event.latLng,
          map: mapInstance,
          draggable: true,
          animation: window.google.maps.Animation.DROP
        })
        setMarker(newMarker)
      }

      // Reverse geocode to get address
      reverseGeocode(lat, lng)
    })

    // Add initial marker if location is provided
    if (initialLocation) {
      const initialMarker = new window.google.maps.Marker({
        position: defaultCenter,
        map: mapInstance,
        draggable: true,
        animation: window.google.maps.Animation.DROP
      })
      setMarker(initialMarker)
      setSelectedLocation({ latitude: defaultCenter.lat, longitude: defaultCenter.lng })
      reverseGeocode(defaultCenter.lat, defaultCenter.lng)
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google) return

    const geocoder = new window.google.maps.Geocoder()
    
    try {
      const results = await geocoder.geocode({ location: { lat, lng } })
      
      if (results[0]) {
        const address = results[0].formatted_address
        setSelectedLocation(prev => prev ? { ...prev, address } : { latitude: lat, longitude: lng, address })
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !window.google) return

    setIsLoading(true)
    setError(null)

    try {
      const geocoder = new window.google.maps.Geocoder()
      const results = await geocoder.geocode({ address: searchQuery })
      
      if (results[0]) {
        const location = results[0].geometry.location
        const lat = location.lat()
        const lng = location.lng()
        
        // Update map center and zoom
        if (map) {
          map.setCenter(location)
          map.setZoom(15)
        }
        
        // Update marker
        if (marker) {
          marker.setPosition(location)
        } else {
          const newMarker = new window.google.maps.Marker({
            position: location,
            map: map,
            draggable: true,
            animation: window.google.maps.Animation.DROP
          })
          setMarker(newMarker)
        }
        
        setSelectedLocation({
          latitude: lat,
          longitude: lng,
          address: results[0].formatted_address
        })
      } else {
        setError('Location not found. Please try a different search term.')
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
    try {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser')
        return
      }

      setIsLoading(true)
      setError(null)
    } catch (err) {
      console.error('Error initializing geolocation:', err)
      setError('Failed to access location services. Please search manually.')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        if (map) {
          const location = new window.google.maps.LatLng(latitude, longitude)
          map.setCenter(location)
          map.setZoom(15)
          
          if (marker) {
            marker.setPosition(location)
          } else {
            const newMarker = new window.google.maps.Marker({
              position: location,
              map: map,
              draggable: true,
              animation: window.google.maps.Animation.DROP
            })
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
          default:
            errorMessage = `Location error: ${error.message || 'Unknown error'}. Please search manually.`
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

  // Show error message if API key is not configured
  if (error && error.includes('API key is not configured')) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                Google Maps Not Configured
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                To use the map picker, please add your Google Maps API key to the environment variables.
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                Add: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key</code>
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            You can still use the search method to select a location.
          </p>
          <Button 
            onClick={() => onLocationSelect({
              name: 'Manual Location',
              latitude: 0,
              longitude: 0
            })}
            variant="outline"
          >
            Continue with Search Method
          </Button>
        </div>
      </div>
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
                <p className="text-sm">Map loading...</p>
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
