import { FeedbackService, type FeedbackItem, type FeedbackFilters } from '@/services/FeedbackService'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}))

describe('FeedbackService', () => {
  const mockFeedback: FeedbackItem[] = [
    {
      id: '1',
      type: 'bug',
      title: 'Login not working',
      description: 'Users cannot log in',
      priority: 'high',
      category: 'Authentication',
      user_email: 'user@example.com',
      device_info: 'Chrome 90.0',
      app_version: '1.0.0',
      status: 'new',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      type: 'suggestion',
      title: 'Add dark mode',
      description: 'Please add dark mode option',
      priority: 'low',
      category: 'UI/UX',
      user_email: 'user2@example.com',
      device_info: 'Firefox 88.0',
      app_version: '1.0.0',
      status: 'resolved',
      created_at: '2024-01-02T00:00:00Z'
    }
  ]

  describe('filterFeedback', () => {
    it('should return all feedback when no filters are applied', () => {
      const filters: FeedbackFilters = {}
      const result = FeedbackService.filterFeedback(mockFeedback, filters)
      expect(result).toHaveLength(2)
    })

    it('should filter by search term', () => {
      const filters: FeedbackFilters = { searchTerm: 'login' }
      const result = FeedbackService.filterFeedback(mockFeedback, filters)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Login not working')
    })

    it('should filter by status', () => {
      const filters: FeedbackFilters = { status: 'new' }
      const result = FeedbackService.filterFeedback(mockFeedback, filters)
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('new')
    })

    it('should filter by type', () => {
      const filters: FeedbackFilters = { type: 'suggestion' }
      const result = FeedbackService.filterFeedback(mockFeedback, filters)
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('suggestion')
    })

    it('should filter by priority', () => {
      const filters: FeedbackFilters = { priority: 'high' }
      const result = FeedbackService.filterFeedback(mockFeedback, filters)
      expect(result).toHaveLength(1)
      expect(result[0].priority).toBe('high')
    })

    it('should apply multiple filters', () => {
      const filters: FeedbackFilters = { 
        searchTerm: 'dark',
        status: 'resolved',
        type: 'suggestion'
      }
      const result = FeedbackService.filterFeedback(mockFeedback, filters)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Add dark mode')
    })

    it('should handle case-insensitive search', () => {
      const filters: FeedbackFilters = { searchTerm: 'DARK' }
      const result = FeedbackService.filterFeedback(mockFeedback, filters)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Add dark mode')
    })
  })

  describe('getStatusIcon', () => {
    it('should return correct icon for new status', () => {
      expect(FeedbackService.getStatusIcon('new')).toBe('clock')
    })

    it('should return correct icon for in_progress status', () => {
      expect(FeedbackService.getStatusIcon('in_progress')).toBe('alert-circle')
    })

    it('should return correct icon for resolved status', () => {
      expect(FeedbackService.getStatusIcon('resolved')).toBe('check-circle')
    })

    it('should return correct icon for closed status', () => {
      expect(FeedbackService.getStatusIcon('closed')).toBe('check-circle')
    })

    it('should return default icon for unknown status', () => {
      expect(FeedbackService.getStatusIcon('unknown')).toBe('clock')
    })
  })

  describe('getPriorityColor', () => {
    it('should return correct color for high priority', () => {
      expect(FeedbackService.getPriorityColor('high')).toBe('text-red-600 bg-red-50')
    })

    it('should return correct color for medium priority', () => {
      expect(FeedbackService.getPriorityColor('medium')).toBe('text-yellow-600 bg-yellow-50')
    })

    it('should return correct color for low priority', () => {
      expect(FeedbackService.getPriorityColor('low')).toBe('text-green-600 bg-green-50')
    })

    it('should return default color for unknown priority', () => {
      expect(FeedbackService.getPriorityColor('unknown')).toBe('text-gray-600 bg-gray-50')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const dateString = '2024-01-01T12:30:00Z'
      const result = FeedbackService.formatDate(dateString)
      expect(result).toMatch(/Jan 1, 2024/)
    })

    it('should handle different date formats', () => {
      const dateString = '2024-12-25T00:00:00.000Z'
      const result = FeedbackService.formatDate(dateString)
      expect(result).toMatch(/Dec 25, 2024/)
    })
  })

  describe('fetchAllFeedback', () => {
    it('should return data and no error on success', async () => {
      const { data, error } = await FeedbackService.fetchAllFeedback()
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('updateFeedbackStatus', () => {
    it('should return success on successful update', async () => {
      const { success, error } = await FeedbackService.updateFeedbackStatus('1', {
        status: 'resolved',
        developer_notes: 'Fixed the issue'
      })
      expect(success).toBe(true)
      expect(error).toBeNull()
    })
  })
}) 