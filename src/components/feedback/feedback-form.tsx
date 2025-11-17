"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { supabase } from "@/lib/supabase"
import { MessageSquare, Bug, Lightbulb, Send, X, Upload, Eye, Trash2 } from "lucide-react"

interface FeedbackFormProps {
  onClose: () => void
  userEmail?: string
  farmId?: string
}

type FeedbackType = "suggestion" | "bug"

interface FeedbackData {
  type: FeedbackType
  title: string
  description: string
  priority: "low" | "medium" | "high"
  category: string
  userEmail?: string
  farmId?: string
  deviceInfo: string
  appVersion: string
  screenshot?: string
}

export function FeedbackForm({ onClose, userEmail, farmId }: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("suggestion")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState("")
  const [actualFarmId, setActualFarmId] = useState<string | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const [formData, setFormData] = useState<FeedbackData>({
    type: "suggestion",
    title: "",
    description: "",
    priority: "medium",
    category: "",
    userEmail,
    farmId,
    deviceInfo: getDeviceInfo(),
    appVersion: "1.0.0"
  })

  // Get the actual farm ID from the farms table
  useEffect(() => {
    const getFarmId = async () => {
      if (!farmId) return

      try {
        // If farmId looks like a user ID (passed from user.id), get the farm
        const { data: farmData, error } = await supabase
          .from('farms')
          .select('id')
          .eq('owner_id', farmId)
          .single()

        if (farmData) {
          setActualFarmId(farmData.id)
        } else {
          // If no farm found, create a default farm for the user
          console.log('No farm found for user, creating default farm...')
          const { data: newFarmData, error: createError } = await supabase
            .from('farms')
            .insert([{
              name: 'Default Farm',
              owner_id: farmId,
              building_count: 1
            }])
            .select('id')
            .single()

          if (newFarmData) {
            setActualFarmId(newFarmData.id)
            console.log('Created default farm with ID:', newFarmData.id)
          } else {
            console.error('Error creating default farm:', createError)
            // If we can't create a farm, set farm_id to null (optional)
            setActualFarmId(null)
          }
        }
      } catch (err) {
        console.error('Error getting farm ID:', err)
        // Fallback to null (optional farm_id)
        setActualFarmId(null)
      }
    }

    getFarmId()
  }, [farmId])

  function getDeviceInfo() {
    if (typeof window === 'undefined') return "Unknown"
    
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const screenSize = `${window.screen.width}x${window.screen.height}`
    const viewport = `${window.innerWidth}x${window.innerHeight}`
    
    return `${platform} | ${screenSize} | ${viewport} | ${userAgent}`
  }

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setScreenshot(result)
      setError("")
    }
    reader.readAsDataURL(file)
  }

  const removeScreenshot = () => {
    setScreenshot(null)
    const fileInput = document.getElementById('screenshot-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const openImageModal = (imageSrc: string) => {
    setSelectedImage(imageSrc)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  const handleInputChange = (field: keyof FeedbackData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const feedbackData: any = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category: formData.category.trim() || "General",
        user_email: formData.userEmail,
        device_info: formData.deviceInfo,
        app_version: formData.appVersion,
        status: "new",
        created_at: new Date().toISOString()
      }

      // Only include farm_id if it exists
      if (actualFarmId) {
        feedbackData.farm_id = actualFarmId
      }

      // Include screenshot if uploaded
      if (screenshot) {
        feedbackData.screenshot = screenshot
      }

      const { error: supabaseError } = await supabase
        .from('feedback')
        .insert([feedbackData])

      if (supabaseError) {
        throw supabaseError
      }

      setSubmitSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (err: any) {
      console.error('Error submitting feedback:', err)
      setError(err.message || "Failed to submit feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = {
    suggestion: [
      "Feature Request",
      "UI/UX Improvement", 
      "Workflow Optimization",
      "Data Management",
      "Reporting",
      "Mobile Experience",
      "General"
    ],
    bug: [
      "Data Entry Issues",
      "Calculation Errors",
      "Display Problems",
      "Performance Issues",
      "Mobile App Issues",
      "Login/Authentication",
      "Data Loss",
      "General"
    ]
  }

  if (submitSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="text-green-500 mb-4">
              <Send className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Feedback Submitted!</h3>
            <p className="text-gray-600">
              Thank you for your {feedbackType}. We'll review it and get back to you soon.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {feedbackType === "suggestion" ? "Submit Suggestion" : "Report Bug"}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Feedback Type Selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={feedbackType === "suggestion" ? "default" : "outline"}
              onClick={() => {
                setFeedbackType("suggestion")
                setFormData(prev => ({ ...prev, type: "suggestion", category: "" }))
              }}
              className="flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              Suggestion
            </Button>
            <Button
              type="button"
              variant={feedbackType === "bug" ? "default" : "outline"}
              onClick={() => {
                setFeedbackType("bug")
                setFormData(prev => ({ ...prev, type: "bug", category: "" }))
              }}
              className="flex items-center gap-2"
            >
              <Bug className="w-4 h-4" />
              Bug Report
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">
                {feedbackType === "suggestion" ? "Suggestion Title" : "Bug Title"} *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder={feedbackType === "suggestion" 
                  ? "Brief description of your suggestion" 
                  : "Brief description of the bug"
                }
                maxLength={100}
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories[feedbackType].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value as "low" | "medium" | "high")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">
                {feedbackType === "suggestion" ? "Detailed Suggestion" : "Bug Description"} *
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={feedbackType === "suggestion"
                  ? "Please describe your suggestion in detail. What would you like to see improved or added?"
                  : "Please describe the bug in detail. What happened? What did you expect to happen? Steps to reproduce?"
                }
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                maxLength={1000}
              />
              <div className="text-sm text-gray-500 mt-1">
                {formData.description.length}/1000 characters
              </div>
            </div>

            {/* Screenshot Upload */}
            <div>
              <Label htmlFor="screenshot">Screenshot (Optional)</Label>
              <div className="space-y-3">
                {!screenshot ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      id="screenshot-input"
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                    />
                    <label htmlFor="screenshot-input" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload a screenshot or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Screenshot uploaded</span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openImageModal(screenshot)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeScreenshot}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="w-32 h-24 rounded border overflow-hidden">
                      <img
                        src={screenshot}
                        alt="Screenshot preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit {feedbackType === "suggestion" ? "Suggestion" : "Bug Report"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Screenshot Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Screenshot</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeImageModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img 
                src={selectedImage} 
                alt="Screenshot - Full size" 
                className="w-full h-auto max-h-[70vh] object-contain rounded" 
              />
            </div>
            <div className="flex justify-end p-4 border-t bg-gray-50">
              <Button onClick={closeImageModal} variant="outline" className="mr-2">
                Close
              </Button>
              <Button 
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = selectedImage
                  link.download = 'screenshot.png'
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
  )
} 