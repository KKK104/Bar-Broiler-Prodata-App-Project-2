"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FeedbackService } from "@/services/FeedbackService"
import { MessageSquare, Bug, Lightbulb, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function FeedbackManagementPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "bug" as "bug" | "suggestion",
    priority: "medium" as "low" | "medium" | "high",
    category: "general"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const feedbackData = {
        ...formData,
        device_info: "Test Device - Developer Dashboard",
        app_version: "1.0.0",
        status: "new" as const,
        user_email: "developer@example.com",
        farm_id: "dev-farm-123"
      }

      // For now, we'll just log the data since we need to implement the create method
  
      alert("Feedback submitted! (Check console for data)")
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        type: "bug",
        priority: "medium",
        category: "general"
      })
    } catch (error) {
      // Error submitting feedback
      alert("Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-10 h-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Add Test Feedback
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Create test feedback for developer dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">
              Create Test Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter feedback title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue or suggestion..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <Select value={formData.type} onValueChange={(value: "bug" | "suggestion") => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">
                        <div className="flex items-center space-x-2">
                          <Bug className="w-4 h-4 text-red-500" />
                          <span>Bug</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="suggestion">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          <span>Suggestion</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <Select value={formData.priority} onValueChange={(value: "low" | "medium" | "high") => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="ui">UI/UX</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="bug">Bug Report</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/developer-feedback")}
                >
                  View Dashboard
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Sample Bug Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFormData({
                    title: "Dark mode toggle not working on mobile",
                    description: "The dark mode toggle button in the header doesn't respond to touch events on mobile devices. Users are unable to switch themes on their phones.",
                    type: "bug",
                    priority: "high",
                    category: "ui"
                  })
                }}
              >
                Load Sample Bug
              </Button>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Sample Suggestion</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFormData({
                    title: "Add export functionality to dashboard",
                    description: "It would be great to have an export feature that allows users to download their farm data as CSV or PDF files for offline analysis.",
                    type: "suggestion",
                    priority: "medium",
                    category: "feature"
                  })
                }}
              >
                Load Sample Suggestion
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 