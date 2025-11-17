"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload, Camera, Eye, X, Edit2 } from "lucide-react"
import type { FarmData } from "@/types/calculator"
import { useState, useEffect } from "react"

interface FarmSetupProps {
  farmData: FarmData
  setFarmData: (data: FarmData) => void
  onSave?: () => Promise<void>
  loading?: boolean
}

export function FarmSetup({ farmData, setFarmData, onSave, loading = false }: FarmSetupProps) {
  const [feedImage, setFeedImage] = useState<string | null>(null)
  const [feedImageFile, setFeedImageFile] = useState<File | null>(null)
  const [selectedFeedImage, setSelectedFeedImage] = useState<string | null>(null)
  const [docImage, setDocImage] = useState<string | null>(null)
  const [docImageFile, setDocImageFile] = useState<File | null>(null)
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null)
  const [isEditingBuilding, setIsEditingBuilding] = useState(false)
  const [isFreshBuild, setIsFreshBuild] = useState(true) // Assume fresh build by default
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load existing images when farm data changes
  useEffect(() => {
    if (farmData.feedSourceImage) {
      setFeedImage(farmData.feedSourceImage)
    }
    if (farmData.docImage) {
      setDocImage(farmData.docImage)
    }
  }, [farmData.feedSourceImage, farmData.docImage])

  // Show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => {
      setSuccessMessage(null)
    }, 3000) // Hide after 3 seconds
  }

  // Validate required fields
  const isFormValid = () => {
    return farmData.volumeDelivered && 
           farmData.deadOnArrival !== undefined && 
           farmData.shortCount !== undefined && 
           farmData.reject !== undefined && 
           farmData.initialGrams && 
           farmData.building && 
           farmData.drNo && 
           farmData.batchStartDate
  }

  // Handle save with loading and success states
  const handleSave = async () => {
    if (!isFormValid()) {
      alert('Please fill in all required fields before saving.')
      return
    }

    if (onSave) {
      try {
        await onSave()
        showSuccessMessage("Farm setup saved successfully! You can now proceed to Daily Tracking.")
      } catch (error) {
        console.error('Error saving farm setup:', error)
        // Error handling is done in the parent component
      }
    }
  }
  const handleInputChange = (field: keyof FarmData, value: string | number) => {
    const updatedData = {
      ...farmData,
      [field]: value,
    }
    
    // Auto-calculate total beginning inventory when relevant fields change
    if (['volumeDelivered', 'deadOnArrival', 'shortCount', 'reject'].includes(field)) {
      const volumeDelivered = field === 'volumeDelivered' ? (typeof value === 'number' ? value : 0) : (farmData.volumeDelivered || 0)
      const deadOnArrival = field === 'deadOnArrival' ? (typeof value === 'number' ? value : 0) : (farmData.deadOnArrival || 0)
      const shortCount = field === 'shortCount' ? (typeof value === 'number' ? value : 0) : (farmData.shortCount || 0)
      const reject = field === 'reject' ? (typeof value === 'number' ? value : 0) : (farmData.reject || 0)
      updatedData.totalBegInv = volumeDelivered - deadOnArrival - shortCount - reject
    }
    
    setFarmData(updatedData)
  }

  const handleFeedImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 [FEED UPLOAD] Starting feed image upload...')
    console.log('📸 [FEED UPLOAD] Event:', event)
    console.log('📸 [FEED UPLOAD] Files:', event.target.files)
    const file = event.target.files?.[0]
    if (!file) {
      console.log('❌ [FEED UPLOAD] No file selected')
      return
    }

    console.log('📸 [FEED UPLOAD] File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ [FEED UPLOAD] Invalid file type:', file.type)
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ [FEED UPLOAD] File too large:', file.size)
      alert("Image size must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      console.log('✅ [FEED UPLOAD] Image loaded successfully, size:', result.length)
      setFeedImage(result)
      setFeedImageFile(file)
      // Save to farm data
      handleInputChange("feedSourceImage", result)
      console.log('✅ [FEED UPLOAD] Feed image uploaded and saved to farm data')
    }
    reader.onerror = (error) => {
      console.error('❌ [FEED UPLOAD] Error reading file:', error)
      alert('Error reading the image file. Please try again.')
    }
    reader.readAsDataURL(file)
  }

  const removeFeedImage = () => {
    setFeedImage(null)
    setFeedImageFile(null)
    handleInputChange("feedSourceImage", "")
    const fileInput = document.getElementById('feed-image-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const openFeedImageModal = (imageSrc: string) => {
    setSelectedFeedImage(imageSrc)
  }

  const closeFeedImageModal = () => {
    setSelectedFeedImage(null)
  }

  const handleDocImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📄 [DOC UPLOAD] Starting DOC image upload...')
    console.log('📄 [DOC UPLOAD] Event:', event)
    console.log('📄 [DOC UPLOAD] Files:', event.target.files)
    const file = event.target.files?.[0]
    if (!file) {
      console.log('❌ [DOC UPLOAD] No file selected')
      return
    }

    console.log('📄 [DOC UPLOAD] File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('❌ [DOC UPLOAD] Invalid file type:', file.type)
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ [DOC UPLOAD] File too large:', file.size)
      alert("Image size must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      console.log('✅ [DOC UPLOAD] Image loaded successfully, size:', result.length)
      setDocImage(result)
      setDocImageFile(file)
      // Save to farm data
      handleInputChange("docImage", result)
      console.log('✅ [DOC UPLOAD] DOC image uploaded and saved to farm data')
    }
    reader.onerror = (error) => {
      console.error('❌ [DOC UPLOAD] Error reading file:', error)
      alert('Error reading the image file. Please try again.')
    }
    reader.readAsDataURL(file)
  }

  const removeDocImage = () => {
    setDocImage(null)
    setDocImageFile(null)
    handleInputChange("docImage", "")
    const fileInput = document.getElementById('doc-image-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const openDocImageModal = (imageSrc: string) => {
    setSelectedDocImage(imageSrc)
  }

  const closeDocImageModal = () => {
    setSelectedDocImage(null)
  }

  // Camera functionality
  const startCamera = (type: 'feed' | 'doc') => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera not available in this browser')
      return
    }

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        // Create a video element to capture the image
        const video = document.createElement('video')
        video.srcObject = stream
        video.play()

        // Create a canvas to capture the image
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          
          // Draw the video frame to canvas
          ctx?.drawImage(video, 0, 0)
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `camera-${type}-${Date.now()}.jpg`, { type: 'image/jpeg' })
              
              if (type === 'feed') {
                handleFeedImageUpload({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>)
              } else {
                handleDocImageUpload({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>)
              }
            }
            
            // Stop the camera stream
            stream.getTracks().forEach(track => track.stop())
          }, 'image/jpeg', 0.8)
        })
      })
      .catch(error => {
        console.error('Error accessing camera:', error)
        alert('Unable to access camera. Please try uploading a file instead.')
      })
  }

  return (
    <div className="space-y-6">
      {/* Loading Overlay */}
      {loading && (
        <div className="p-4 text-center bg-blue-50 border border-blue-200 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-blue-600">Saving farm setup to database...</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Delivery Information</CardTitle>
          <CardDescription>Initial batch and delivery details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="volumeDelivered">Total Delivered</Label>
              <Input
                id="volumeDelivered"
                type="number"
                value={farmData.volumeDelivered || ''}
                onChange={(e) => handleInputChange("volumeDelivered", Number.parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="deadOnArrival">Dead on Arrival</Label>
              <Input
                id="deadOnArrival"
                type="number"
                value={farmData.deadOnArrival || ''}
                onChange={(e) => handleInputChange("deadOnArrival", Number.parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="shortCount">Short Count</Label>
              <Input
                id="shortCount"
                type="number"
                value={farmData.shortCount || ''}
                onChange={(e) => handleInputChange("shortCount", Number.parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="reject">Reject</Label>
              <Input
                id="reject"
                type="number"
                value={farmData.reject || ''}
                onChange={(e) => handleInputChange("reject", Number.parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="totalBegInv">Total Beginning Inventory</Label>
            <Input
              id="totalBegInv"
              type="number"
              value={farmData.totalBegInv || ''}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="initialGrams">Initial Weight (Grams)</Label>
            <Input
              id="initialGrams"
              type="number"
              step="0.1"
              value={farmData.initialGrams || ''}
              onChange={(e) => handleInputChange("initialGrams", Number.parseFloat(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Farm Details</CardTitle>
          <CardDescription>Building and supplier information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Building fields - only show for fresh builds or when editing */}
          {isFreshBuild && (
            <>
              <div>
                <Label htmlFor="building">Building Number</Label>
                <Input
                  id="building"
                  type="number"
                  value={farmData.building || ''}
                  onChange={(e) => handleInputChange("building", Number.parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="drNo">DR Number</Label>
                <Input id="drNo" value={farmData.drNo} onChange={(e) => handleInputChange("drNo", e.target.value)} />
              </div>

              <div>
                <Label htmlFor="docSource">Doc Source</Label>
                <Input
                  id="docSource"
                  value={farmData.docSource}
                  onChange={(e) => handleInputChange("docSource", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="feeds">Feeds Supplier</Label>
                <Input id="feeds" value={farmData.feeds} onChange={(e) => handleInputChange("feeds", e.target.value)} />
              </div>
            </>
          )}

          {/* Show building info for existing builds */}
          {!isFreshBuild && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">Building Information</h4>
                  <p className="text-sm text-gray-600">Building #{farmData.building} - {farmData.drNo}</p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditingBuilding(true)}
                  className="flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
              </div>
            </div>
          )}

          {/* Edit mode for existing builds */}
          {!isFreshBuild && isEditingBuilding && (
            <>
              <div>
                <Label htmlFor="building">Building Number</Label>
                <Input
                  id="building"
                  type="number"
                  value={farmData.building || ''}
                  onChange={(e) => handleInputChange("building", Number.parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="drNo">DR Number</Label>
                <Input id="drNo" value={farmData.drNo} onChange={(e) => handleInputChange("drNo", e.target.value)} />
              </div>

              <div>
                <Label htmlFor="docSource">Doc Source</Label>
                <Input
                  id="docSource"
                  value={farmData.docSource}
                  onChange={(e) => handleInputChange("docSource", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="feeds">Feeds Supplier</Label>
                <Input id="feeds" value={farmData.feeds} onChange={(e) => handleInputChange("feeds", e.target.value)} />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditingBuilding(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    setIsEditingBuilding(false)
                    // Changes are automatically saved through handleInputChange
                    showSuccessMessage("Building information updated successfully!")
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="batchStartDate">Batch Start Date</Label>
            <Input
              id="batchStartDate"
              type="date"
              value={farmData.batchStartDate}
              onChange={(e) => handleInputChange("batchStartDate", e.target.value)}
            />
          </div>

          {/* Source of Feed Upload */}
          <div>
            <Label>Source of Feed Upload</Label>
            <div className="mt-2">
              <input
                id="feed-image-input"
                type="file"
                accept="image/*"
                onChange={handleFeedImageUpload}
                className="hidden"
                style={{ display: 'none' }}
              />
              {!feedImage ? (
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => {
                      console.log('🖱️ [FEED BUTTON] Upload button clicked')
                      const input = document.getElementById('feed-image-input') as HTMLInputElement
                      if (input) {
                        console.log('🖱️ [FEED BUTTON] Input element found, triggering click')
                        input.click()
                      } else {
                        console.log('❌ [FEED BUTTON] Input element not found')
                      }
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Picture
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => startCamera('feed')}
                  >
                    <Camera className="w-4 h-4" />
                    Take Picture
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-16 h-12 rounded border overflow-hidden">
                    <img
                      src={feedImage}
                      alt="Feed source preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openFeedImageModal(feedImage)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeFeedImage}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DOC Upload */}
          <div>
            <Label>DOC Upload</Label>
            <div className="mt-2">
              <input
                id="doc-image-input"
                type="file"
                accept="image/*"
                onChange={handleDocImageUpload}
                className="hidden"
                style={{ display: 'none' }}
              />
              {!docImage ? (
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => {
                      console.log('🖱️ [DOC BUTTON] Upload button clicked')
                      const input = document.getElementById('doc-image-input') as HTMLInputElement
                      if (input) {
                        console.log('🖱️ [DOC BUTTON] Input element found, triggering click')
                        input.click()
                      } else {
                        console.log('❌ [DOC BUTTON] Input element not found')
                      }
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    Upload Picture
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => startCamera('doc')}
                  >
                    <Camera className="w-4 h-4" />
                    Take Picture
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-16 h-12 rounded border overflow-hidden">
                    <img
                      src={docImage}
                      alt="DOC preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openDocImageModal(docImage)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeDocImage}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Success Message */}
      {successMessage && (
        <div className="p-4 text-center bg-green-50 border border-green-200 rounded-lg mt-4">
          <p className="text-sm text-green-600 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Save Button */}
      {onSave && (
        <Button 
          onClick={handleSave} 
          className="mt-4 w-full"
          disabled={loading || !isFormValid()}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving Farm Setup...
            </>
          ) : (
            isFormValid() ? 'Save Farm Setup' : 'Complete Required Fields to Save'
          )}
        </Button>
      )}

      {/* Feed Image Modal */}
      {selectedFeedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Feed Source Photo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeFeedImageModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img 
                src={selectedFeedImage} 
                alt="Feed source photo - Full size" 
                className="w-full h-auto max-h-[70vh] object-contain rounded" 
              />
            </div>
            <div className="flex justify-end p-4 border-t bg-gray-50">
              <Button onClick={closeFeedImageModal} variant="outline" className="mr-2">
                Close
              </Button>
              <Button 
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = selectedFeedImage
                  link.download = 'feed-source-photo.png'
                  link.click()
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DOC Image Modal */}
      {selectedDocImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">DOC Photo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeDocImageModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img 
                src={selectedDocImage} 
                alt="DOC photo - Full size" 
                className="w-full h-auto max-h-[70vh] object-contain rounded" 
              />
            </div>
            <div className="flex justify-end p-4 border-t bg-gray-50">
              <Button onClick={closeDocImageModal} variant="outline" className="mr-2">
                Close
              </Button>
              <Button 
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = selectedDocImage
                  link.download = 'doc-photo.png'
                  link.click()
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
