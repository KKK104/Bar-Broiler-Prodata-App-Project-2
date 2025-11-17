import { supabase } from '@/lib/supabase'

export interface FeedbackItem {
  id: string
  type: "suggestion" | "bug"
  title: string
  description: string
  priority: "low" | "medium" | "high"
  category: string
  user_email?: string
  farm_id?: string
  device_info: string
  app_version: string
  status: "new" | "in_progress" | "resolved" | "closed"
  created_at: string
  updated_at?: string
  developer_notes?: string
  screenshot?: string
}

export interface FeedbackFilters {
  searchTerm?: string
  status?: string
  type?: string
  priority?: string
}

export interface UpdateFeedbackData {
  status: string
  developer_notes?: string
}

export class FeedbackService {
  static async fetchAllFeedback(): Promise<{ data: FeedbackItem[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching feedback:', error)
        return { data: null, error: error.message }
      }

      return { data: data || [], error: null }
    } catch (err: any) {
      console.error('Unexpected error fetching feedback:', err)
      return { data: null, error: err.message || 'Failed to fetch feedback' }
    }
  }

  static async updateFeedbackStatus(
    feedbackId: string, 
    updateData: UpdateFeedbackData
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', feedbackId)

      if (error) {
        console.error('Error updating feedback:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (err: any) {
      console.error('Unexpected error updating feedback:', err)
      return { success: false, error: err.message || 'Failed to update feedback' }
    }
  }

  static async deleteFeedback(feedbackId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackId)

      if (error) {
        console.error('Error deleting feedback:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (err: any) {
      console.error('Unexpected error deleting feedback:', err)
      return { success: false, error: err.message || 'Failed to delete feedback' }
    }
  }

  static async uploadScreenshot(file: File): Promise<{ url: string | null; error: string | null }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `feedback-screenshots/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('feedback-assets')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading screenshot:', uploadError)
        return { url: null, error: uploadError.message }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('feedback-assets')
        .getPublicUrl(filePath)

      return { url: publicUrl, error: null }
    } catch (err: any) {
      console.error('Unexpected error uploading screenshot:', err)
      return { url: null, error: err.message || 'Failed to upload screenshot' }
    }
  }

  static filterFeedback(feedback: FeedbackItem[], filters: FeedbackFilters): FeedbackItem[] {
    return feedback.filter(item => {
      const matchesSearch = !filters.searchTerm || 
        item.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (item.user_email && item.user_email.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      
      const matchesStatus = !filters.status || filters.status === "all" || item.status === filters.status
      const matchesType = !filters.type || filters.type === "all" || item.type === filters.type
      const matchesPriority = !filters.priority || filters.priority === "all" || item.priority === filters.priority

      return matchesSearch && matchesStatus && matchesType && matchesPriority
    })
  }

  static getStatusIcon(status: string) {
    switch (status) {
      case "new":
        return "clock"
      case "in_progress":
        return "alert-circle"
      case "resolved":
        return "check-circle"
      case "closed":
        return "check-circle"
      default:
        return "clock"
    }
  }

  static getPriorityColor(priority: string) {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  static formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  static getFeedbackStats(feedback: FeedbackItem[]) {
    const total = feedback.length
    const bugs = feedback.filter(f => f.type === "bug").length
    const suggestions = feedback.filter(f => f.type === "suggestion").length
    const newItems = feedback.filter(f => f.status === "new").length
    const inProgress = feedback.filter(f => f.status === "in_progress").length
    const resolved = feedback.filter(f => f.status === "resolved").length
    const highPriority = feedback.filter(f => f.priority === "high").length

    return { total, bugs, suggestions, newItems, inProgress, resolved, highPriority }
  }
} 