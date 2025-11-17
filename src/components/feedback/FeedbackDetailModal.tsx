"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FeedbackService, FeedbackItem } from "@/services/FeedbackService"
import { 
  Bug, 
  Lightbulb, 
  Calendar, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Image, 
  Edit, 
  Trash2, 
  X,
  Download,
  Eye,
  MessageSquare,
  Smartphone,
  Monitor,
  Globe
} from "lucide-react"

interface FeedbackDetailModalProps {
  feedback: FeedbackItem
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (feedbackId: string, status: string, notes?: string) => Promise<void>
  onDelete: (feedbackId: string) => Promise<void>
}

export function FeedbackDetailModal({
  feedback,
  isOpen,
  onClose,
  onUpdateStatus,
  onDelete
}: FeedbackDetailModalProps) {
  // Safety check for feedback
  if (!feedback) {
    return null
  }
  
  const [status, setStatus] = useState(feedback.status)
  const [developerNotes, setDeveloperNotes] = useState(feedback.developer_notes || "")
  const [isUpdating, setIsUpdating] = useState(false)
  const [showScreenshot, setShowScreenshot] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "in_progress":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "closed":
        return <CheckCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const getTypeIcon = (type: string) => {
    return type === "bug" ? (
      <Bug className="w-5 h-5 text-red-500" />
    ) : (
      <Lightbulb className="w-5 h-5 text-yellow-500" />
    )
  }

  const handleUpdateStatus = async () => {
    setIsUpdating(true)
    try {
      await onUpdateStatus(feedback.id, status, developerNotes)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) {
      await onDelete(feedback.id)
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getTypeIcon(feedback.type)}
                <span className="text-xl font-bold">{feedback.title}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status and Priority */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Badge className={getPriorityColor(feedback.priority)}>
                {feedback.priority} Priority
              </Badge>
              
              <Badge variant="outline" className="capitalize">
                {feedback.type}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Description</h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {feedback.description}
                </p>
              </div>
            </div>

            {/* Screenshot */}
            {feedback.screenshot && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex items-center space-x-2">
                  <Image className="w-5 h-5" />
                  <span>Screenshot</span>
                </h3>
                <div className="relative">
                  <img
                    src={feedback.screenshot}
                    alt="Feedback screenshot"
                    className="w-full max-w-md rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setShowScreenshot(true)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setShowScreenshot(true)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Created: {formatDate(feedback.created_at)}
                  </span>
                </div>
                
                {feedback.updated_at && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Updated: {formatDate(feedback.updated_at)}
                    </span>
                  </div>
                )}
                
                {feedback.user_email && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      User: {feedback.user_email}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Device: {feedback.device_info}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Version: {feedback.app_version}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Category: {feedback.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Developer Notes */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex items-center space-x-2">
                <Edit className="w-5 h-5" />
                <span>Developer Notes</span>
              </h3>
              <Textarea
                value={developerNotes}
                onChange={(e) => setDeveloperNotes(e.target.value)}
                placeholder="Add developer notes, progress updates, or resolution details..."
                className="min-h-[100px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? "Updating..." : "Update Status"}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDelete}
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </Button>
              
              {feedback.screenshot && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = feedback.screenshot!
                    link.download = `screenshot-${feedback.id}.png`
                    link.click()
                  }}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Screenshot</span>
                </Button>
              )}
              
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screenshot Modal */}
      {showScreenshot && feedback.screenshot && (
        <Dialog open={showScreenshot} onOpenChange={setShowScreenshot}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Screenshot - {feedback.title}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={feedback.screenshot}
                alt="Feedback screenshot"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = feedback.screenshot!
                  link.download = `screenshot-${feedback.id}.png`
                  link.click()
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={() => setShowScreenshot(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
} 