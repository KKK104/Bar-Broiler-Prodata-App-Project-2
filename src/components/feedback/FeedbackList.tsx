"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bug, Lightbulb, Calendar, User, Clock, AlertCircle, CheckCircle, Image } from "lucide-react"
import { FeedbackItem } from "@/services/FeedbackService"

interface FeedbackListProps {
  feedback: FeedbackItem[]
  onSelectFeedback: (feedback: FeedbackItem) => void
}

export function FeedbackList({ feedback, onSelectFeedback }: FeedbackListProps) {
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
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Invalid date'
    }
  }

  if (feedback.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
          <p className="text-gray-600">
            No feedback has been submitted yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {item.type === "suggestion" ? (
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Bug className="w-5 h-5 text-red-500" />
                  )}
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    {getStatusIcon(item.status)}
                    {item.status.replace('_', ' ')}
                  </span>
                  {item.screenshot && (
                    <span className="flex items-center gap-1 text-sm text-blue-500">
                      <Image className="w-4 h-4" />
                      Screenshot
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(item.created_at)}
                  </span>
                  {item.user_email && (
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {item.user_email}
                    </span>
                  )}
                  <span className="capitalize">{item.category}</span>
                </div>

                {item.developer_notes && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Developer Notes:</strong> {item.developer_notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => onSelectFeedback(item)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 