"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { FeedbackButton } from "@/components/feedback/feedback-button"
import { FeedbackList } from "@/components/feedback/FeedbackList"
import { FeedbackDetailModal } from "@/components/feedback/FeedbackDetailModal"
import { FeedbackFilters } from "@/components/feedback/FeedbackFilters"
import { FeedbackService, FeedbackItem, FeedbackFilters as FilterType } from "@/services/FeedbackService"
import { 
  Bug, 
  Lightbulb, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Download,
  Eye,
  Plus,
  BarChart3,
  Settings,
  Users,
  Calendar,
  TrendingUp,
  RefreshCw
} from "lucide-react"

export default function DeveloperDashboardPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackItem[]>([])
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FilterType>({
    status: "all",
    type: "all",
    priority: "all"
  })

  // Load feedback on component mount
  useEffect(() => {
    loadFeedback()
  }, [])

  // Filter feedback when search term or filters change
  useEffect(() => {
    const filtered = FeedbackService.filterFeedback(feedback, {
      ...filters,
      searchTerm
    })
    setFilteredFeedback(filtered)
  }, [feedback, searchTerm, filters])

  const loadFeedback = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await FeedbackService.fetchAllFeedback()
      if (data) {
        setFeedback(data)
      } else {
        console.error("Failed to load feedback:", error)
        setFeedback([]) // Set empty array as fallback
      }
    } catch (err) {
      console.error("Error loading feedback:", err)
      setFeedback([]) // Set empty array as fallback
    }
    setIsLoading(false)
  }

  const handleUpdateStatus = async (feedbackId: string, status: string, notes?: string) => {
    try {
      const { success, error } = await FeedbackService.updateFeedbackStatus(feedbackId, {
        status,
        developer_notes: notes
      })
      
      if (success) {
        await loadFeedback() // Reload to get updated data
        setIsModalOpen(false)
      } else {
        console.error("Failed to update feedback:", error)
      }
    } catch (err) {
      console.error("Error updating feedback:", err)
    }
  }

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) {
      try {
        const { success, error } = await FeedbackService.deleteFeedback(feedbackId)
        if (success) {
          await loadFeedback()
        } else {
          console.error("Failed to delete feedback:", error)
          alert("Failed to delete feedback. Please try again.")
        }
      } catch (err) {
        console.error("Error deleting feedback:", err)
        alert("Failed to delete feedback. Please try again.")
      }
    }
  }

  const handleSelectFeedback = (item: FeedbackItem) => {
    setSelectedFeedback(item)
    setIsModalOpen(true)
  }

  const getStats = () => {
    const total = feedback.length
    const bugs = feedback.filter(f => f.type === "bug").length
    const suggestions = feedback.filter(f => f.type === "suggestion").length
    const newItems = feedback.filter(f => f.status === "new").length
    const inProgress = feedback.filter(f => f.status === "in_progress").length
    const resolved = feedback.filter(f => f.status === "resolved").length
    const highPriority = feedback.filter(f => f.priority === "high").length

    return { total, bugs, suggestions, newItems, inProgress, resolved, highPriority }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Developer Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Feedback Management & Bug Tracking
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <FeedbackButton 
                userEmail="developer@example.com"
                farmId="dev-farm-123"
                variant="outline"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Feedback</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bugs</p>
                  <p className="text-2xl font-bold text-red-600">{stats.bugs}</p>
                </div>
                <Bug className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.highPriority}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="dark:bg-gray-800 dark:border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search feedback by title, description, or user email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <FeedbackFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setFilters({ status: "all", type: "all", priority: "all" })
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Feedback & Bugs ({filteredFeedback.length})
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadFeedback}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {isLoading ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading feedback...</p>
              </CardContent>
            </Card>
          ) : (
            <FeedbackList
              feedback={filteredFeedback}
              onSelectFeedback={handleSelectFeedback}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = "/feedback-management"}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Test Feedback
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = "/"}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Live App
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => window.location.href = "/performance-dashboard"}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Performance Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span>Status Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">New</span>
                <Badge variant="secondary">{stats.newItems}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                <Badge variant="secondary">{stats.inProgress}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Resolved</span>
                <Badge variant="secondary">{stats.resolved}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {feedback.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {FeedbackService.formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedFeedback(null)
          }}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteFeedback}
        />
      )}
    </div>
  )
} 