'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/calculator/use-toast'
import { ToastTitle, ToastDescription } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { HarvestInput } from '@/types/calculator'
import { Plus, Truck, Save, FileText, Camera, Upload, X, Video } from 'lucide-react'
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'

interface HarvestInputProps {
  buildingId: string
  farmId: string
  cycleNumber: number
  onHarvestAdded?: (harvest: HarvestInput) => void
}

interface HarvestFormData {
  plateNumber: string
  buyerName: string
  totalBirds: number
  totalWeight: number
  pricePerKilogram: number
  harvestDate: string
  documentationUrl?: string
  plateImage?: File | null
  plateImageUrl?: string
}

const initialFormData: HarvestFormData = {
  plateNumber: '',
  buyerName: '',
  totalBirds: 0,
  totalWeight: 0,
  pricePerKilogram: 0,
  harvestDate: new Date().toISOString().split('T')[0],
  documentationUrl: '',
  plateImage: null,
  plateImageUrl: ''
}

export function HarvestInputComponent({ buildingId, farmId, cycleNumber, onHarvestAdded }: HarvestInputProps) {
  const [formData, setFormData] = useState<HarvestFormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [harvestInputs, setHarvestInputs] = useState<HarvestInput[]>([])
  // Camera functionality handled by Capacitor
  const { toast } = useToast()

  // Calculate derived values
  const alw = formData.totalBirds > 0 ? (formData.totalWeight / formData.totalBirds) : 0
  const totalRevenue = formData.totalWeight * formData.pricePerKilogram

  // Check camera availability
  const isCameraAvailable = () => {
    return true // Capacitor camera is always available on mobile
  }

  useEffect(() => {
    fetchHarvestInputs()
  }, [buildingId, cycleNumber])

  // Camera cleanup handled by Capacitor

  const fetchHarvestInputs = async () => {
    try {
      const { data, error } = await supabase
        .from('harvest_inputs')
        .select('*')
        .eq('building_id', buildingId)
        .eq('cycle_number', cycleNumber)
        .order('harvest_date', { ascending: false })

      if (error) throw error
      
      // Transform snake_case to camelCase for display
      const transformedInputs = (data || []).map(item => ({
        id: item.id,
        buildingId: item.building_id,
        farmId: item.farm_id,
        cycleNumber: item.cycle_number,
        plateNumber: item.plate_number,
        buyerName: item.buyer_name,
        totalBirds: item.total_birds,
        totalWeight: item.total_weight,
        pricePerKilogram: item.price_per_kilogram,
        harvestDate: item.harvest_date,
        documentationUrl: item.documentation_url,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))
      setHarvestInputs(transformedInputs)
    } catch (error) {
      console.error('Error fetching harvest inputs:', error)
    }
  }

  const handleInputChange = (field: keyof HarvestFormData, value: string | number | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const startCamera = async () => {
    console.log('📸 Starting Capacitor camera...')
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      })
      
      console.log('✅ Photo captured:', image)
      
      if (image.dataUrl) {
        // Convert data URL to File object
        const response = await fetch(image.dataUrl)
        const blob = await response.blob()
        const file = new File([blob], `plate-photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        
        handleInputChange('plateImage', file)
        await handleImageUpload(file)
      }
    } catch (error: any) {
      console.error('❌ Error accessing camera:', error)
      
      let errorMessage = 'Unable to access camera. Please check permissions.'
      
      if (error.message.includes('User cancelled')) {
        console.log('📸 User cancelled photo capture')
        return
      } else if (error.message.includes('permission')) {
        errorMessage = 'Camera permission denied. Please allow camera access in your device settings.'
      } else if (error.message.includes('camera')) {
        errorMessage = 'No camera found on this device.'
      }
      
      toast({
        children: (
          <div>
            <ToastTitle>Camera Error</ToastTitle>
            <ToastDescription>{errorMessage}</ToastDescription>
          </div>
        ),
        variant: "destructive"
      })
    }
  }

  // Capacitor camera handles photo capture directly, no need for separate functions

  const handleImageUpload = async (file: File) => {
    if (!file) return null

    console.log('🖼️ Starting image upload process...')
    setIsUploading(true)
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `plate-${buildingId}-${cycleNumber}-${Date.now()}.${fileExt}`
      console.log('📁 Generated filename:', fileName)
      
      // Upload to Supabase storage
      console.log('☁️ Uploading to Supabase storage bucket: harvest-images')
      const { data, error } = await supabase.storage
        .from('harvest-images')
        .upload(fileName, file)
      
      console.log('📤 Upload response:', { data, error })

      if (error) {
        console.log('🚨 Upload error:', error)
        // Try to create bucket if it doesn't exist
        if (error.message.includes('not found') || error.message.includes('bucket')) {
          console.log('🪣 Attempting to create bucket...')
          const { error: bucketError } = await supabase.storage
            .createBucket('harvest-images', { 
              public: true,
              allowedMimeTypes: ['image/*'],
              fileSizeLimit: 10485760 // 10MB
            })
          
          if (bucketError) {
            console.log('❌ Bucket creation failed:', bucketError)
            // If bucket creation fails, try anyway (bucket might exist)
            console.log('🔄 Retrying upload without bucket creation...')
          } else {
            console.log('✅ Bucket created successfully!')
          }
          
          // Retry upload regardless of bucket creation result
          console.log('🔄 Retrying upload...')
          const { data: retryData, error: retryError } = await supabase.storage
            .from('harvest-images')
            .upload(fileName, file)
            
          if (retryError) {
            console.log('❌ Retry upload failed:', retryError)
            throw retryError
          }
          console.log('✅ Retry upload successful!')
          return retryData
        }
        throw error
      }

      // Get public URL
      console.log('🔗 Getting public URL for:', fileName)
      const { data: urlData } = supabase.storage
        .from('harvest-images')
        .getPublicUrl(fileName)
      
      console.log('🌐 Public URL response:', urlData)
      console.log('📸 Setting image URL to:', urlData.publicUrl)

      setFormData(prev => ({
        ...prev,
        plateImageUrl: urlData.publicUrl
      }))

      console.log('✅ Image upload completed successfully!')
      return data
    } catch (error: any) {
      console.error('❌ Image upload failed:', error)
      console.error('Error details:', error.message, error.code, error.details)
      toast({
        children: (
          <div>
            <ToastTitle>Upload Error</ToastTitle>
            <ToastDescription>{error.message || "Failed to upload image"}</ToastDescription>
          </div>
        ),
        variant: "destructive"
      })
      return null
    } finally {
      console.log('🏁 Upload process finished, setting isUploading to false')
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.plateNumber || !formData.buyerName || formData.totalBirds <= 0 || formData.totalWeight <= 0) {
      toast({
        children: (
          <div>
            <ToastTitle>Validation Error</ToastTitle>
            <ToastDescription>Please fill in all required fields with valid values.</ToastDescription>
          </div>
        ),
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      // Upload image if provided
      let plateImageUrl = formData.plateImageUrl || ''
      if (formData.plateImage && !plateImageUrl) {
        await handleImageUpload(formData.plateImage)
        plateImageUrl = formData.plateImageUrl || ''
      }

      const harvestInputData = {
        building_id: buildingId,
        farm_id: farmId,
        cycle_number: cycleNumber,
        plate_number: formData.plateNumber.trim(),
        buyer_name: formData.buyerName.trim(),
        total_birds: Math.max(1, Math.floor(formData.totalBirds)),
        total_weight: Math.max(0.01, parseFloat(formData.totalWeight.toString())),
        price_per_kilogram: Math.max(0.01, parseFloat(formData.pricePerKilogram.toString())),
        harvest_date: formData.harvestDate,
        documentation_url: plateImageUrl || formData.documentationUrl || null
      }

      console.log('Sending harvest data:', harvestInputData)

      const { error } = await supabase
        .from('harvest_inputs')
        .insert(harvestInputData)

      if (error) {
        console.error('Supabase error details:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        throw error
      }

      toast({
        children: (
          <div>
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Harvest input added successfully!</ToastDescription>
          </div>
        )
      })

      // Reset form and refresh list
      setFormData(initialFormData)
      fetchHarvestInputs()
      
      // Note: onHarvestAdded callback removed since we refresh the list anyway

    } catch (error: any) {
      toast({
        children: (
          <div>
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>{error.message || "Failed to add harvest input"}</ToastDescription>
          </div>
        ),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Add Harvest Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-base sm:text-lg">Add Harvest Input</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 sm:col-start-1">
                <Label htmlFor="plateNumber" className="text-sm sm:text-base">Plate No. of Truck *</Label>
                <Input
                  id="plateNumber"
                  type="text"
                  value={formData.plateNumber}
                  onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                  placeholder="e.g., ABC-123"
                  required
                  className="mt-1"
                />
                
                {/* Plate Image Upload */}
                <div className="mt-2">
                  <Label htmlFor="plateImage" className="text-xs sm:text-sm text-gray-600">
                    Upload Plate Photo (Optional)
                  </Label>
                  <div className="mt-1 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <label 
                      htmlFor="plateImage" 
                      className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm bg-white hover:bg-gray-50 w-full sm:w-auto justify-center"
                    >
                      <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      {formData.plateImage ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    <Button
                      type="button"
                      onClick={startCamera}
                      variant="outline"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm bg-white hover:bg-gray-50 w-full sm:w-auto justify-center"
                      disabled={isUploading || !isCameraAvailable()}
                      title={!isCameraAvailable() ? "Camera not available in this browser" : "Take a photo with your camera"}
                    >
                      <Video className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      {isUploading ? "Uploading..." : isCameraAvailable() ? "Take Photo" : "Camera Unavailable"}
                    </Button>
                    <input
                      id="plateImage"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        console.log('File input changed:', e.target.files)
                        const file = e.target.files?.[0] || null
                        console.log('Selected file:', file)
                        handleInputChange('plateImage', file)
                        if (file) {
                          console.log('Starting upload for:', file.name, file.size, 'bytes')
                          handleImageUpload(file)
                        } else {
                          console.log('No file selected')
                        }
                      }}
                    />
                    {isUploading && (
                      <div className="flex items-center text-xs sm:text-sm text-blue-600">
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-pulse" />
                        Uploading...
                      </div>
                    )}
                    {formData.plateImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            plateImage: null, 
                            plateImageUrl: '' 
                          }))
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Image Preview */}
                  {formData.plateImageUrl && (
                    <div className="mt-2">
                      <img 
                        src={formData.plateImageUrl} 
                        alt="Plate preview" 
                        className="h-16 sm:h-20 w-auto rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="buyerName" className="text-sm sm:text-base">Name of Buyer *</Label>
                <Input
                  id="buyerName"
                  type="text"
                  value={formData.buyerName}
                  onChange={(e) => handleInputChange('buyerName', e.target.value)}
                  placeholder="Buyer company/person name"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="totalBirds" className="text-sm sm:text-base">Total Number of Birds *</Label>
                <Input
                  id="totalBirds"
                  type="number"
                  value={formData.totalBirds}
                  onChange={(e) => handleInputChange('totalBirds', parseInt(e.target.value) || 0)}
                  min="1"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="totalWeight" className="text-sm sm:text-base">Total Weight (kg) *</Label>
                <Input
                  id="totalWeight"
                  type="number"
                  step="0.01"
                  value={formData.totalWeight}
                  onChange={(e) => handleInputChange('totalWeight', parseFloat(e.target.value) || 0)}
                  min="0.01"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pricePerKilogram" className="text-sm sm:text-base">Price per Kilogram (₱) *</Label>
                <Input
                  id="pricePerKilogram"
                  type="number"
                  step="0.01"
                  value={formData.pricePerKilogram}
                  onChange={(e) => handleInputChange('pricePerKilogram', parseFloat(e.target.value) || 0)}
                  min="0.01"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="harvestDate" className="text-sm sm:text-base">Harvest Date *</Label>
                <Input
                  id="harvestDate"
                  type="date"
                  value={formData.harvestDate}
                  onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="documentationUrl" className="text-sm sm:text-base">Documentation URL (Optional)</Label>
              <Input
                id="documentationUrl"
                type="url"
                value={formData.documentationUrl}
                onChange={(e) => handleInputChange('documentationUrl', e.target.value)}
                placeholder="Link to truck documentation/photos"
                className="mt-1"
              />
            </div>

            {/* Calculated Values */}
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900 text-sm sm:text-base">Calculated Values:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                <p><span className="font-medium">ALW (Average Live Weight):</span> {alw.toFixed(2)} kg</p>
                <p><span className="font-medium">Total Revenue:</span> ₱{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <Button type="submit" disabled={isLoading || isUploading} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Adding..." : isUploading ? "Uploading..." : "Add Harvest Input"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Harvest Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-base sm:text-lg">Harvest Inputs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {harvestInputs.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-sm sm:text-base">No harvest inputs recorded yet.</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {harvestInputs.map((harvest) => (
                <div key={harvest.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="sm:col-span-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{harvest.buyerName}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Plate: {harvest.plateNumber}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Date: {new Date(harvest.harvestDate).toLocaleDateString()}</p>
                      {harvest.documentationUrl && harvest.documentationUrl.includes('plate-') && (
                        <div className="mt-2">
                          <img 
                            src={harvest.documentationUrl} 
                            alt="Plate photo" 
                            className="h-10 sm:h-12 w-auto rounded border cursor-pointer hover:opacity-80"
                            onClick={() => window.open(harvest.documentationUrl, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm space-y-1">
                      <p><span className="font-medium">Birds:</span> {harvest.totalBirds.toLocaleString()}</p>
                      <p><span className="font-medium">Weight:</span> {harvest.totalWeight.toLocaleString()} kg</p>
                      <p><span className="font-medium">Price/kg:</span> ₱{harvest.pricePerKilogram.toFixed(2)}</p>
                    </div>
                    <div className="text-xs sm:text-sm space-y-1">
                      <p><span className="font-medium">ALW:</span> {(harvest.totalWeight / harvest.totalBirds).toFixed(2)} kg</p>
                      <p><span className="font-medium">Revenue:</span> ₱{(harvest.totalWeight * harvest.pricePerKilogram).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      {harvest.documentationUrl && (
                        <a 
                          href={harvest.documentationUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Documentation
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 