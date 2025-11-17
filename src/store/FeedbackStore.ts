import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { FeedbackItem, FeedbackFilters } from '@/services/FeedbackService'
import { FeedbackService } from '@/services/FeedbackService'
import { createError, ErrorType } from '@/lib/ErrorManager'

interface FeedbackState {
  // State
  feedback: FeedbackItem[]
  filteredFeedback: FeedbackItem[]
  filters: FeedbackFilters
  loading: boolean
  error: string | null
  selectedFeedback: FeedbackItem | null
  developerNotes: string
  updatingStatus: boolean

  // Actions
  setFeedback: (feedback: FeedbackItem[]) => void
  setFilters: (filters: FeedbackFilters) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedFeedback: (feedback: FeedbackItem | null) => void
  setDeveloperNotes: (notes: string) => void
  setUpdatingStatus: (updating: boolean) => void

  // Async Actions
  fetchFeedback: () => Promise<void>
  updateFeedbackStatus: (feedbackId: string, status: string, notes?: string) => Promise<void>
  clearFilters: () => void
  applyFilters: () => void
}

export const useFeedbackStore = create<FeedbackState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        feedback: [],
        filteredFeedback: [],
        filters: {},
        loading: false,
        error: null,
        selectedFeedback: null,
        developerNotes: '',
        updatingStatus: false,

        // State Setters
        setFeedback: (feedback) => {
          set({ feedback, filteredFeedback: feedback })
        },

        setFilters: (filters) => {
          set({ filters })
          get().applyFilters()
        },

        setLoading: (loading) => set({ loading }),

        setError: (error) => set({ error }),

        setSelectedFeedback: (selectedFeedback) => set({ selectedFeedback }),

        setDeveloperNotes: (developerNotes) => set({ developerNotes }),

        setUpdatingStatus: (updatingStatus) => set({ updatingStatus }),

        // Async Actions
        fetchFeedback: async () => {
          const { setLoading, setError, setFeedback } = get()
          
          try {
            setLoading(true)
            setError(null)

            const { data, error } = await FeedbackService.fetchAllFeedback()

            if (error) {
              const appError = createError(
                ErrorType.DATABASE,
                'Failed to fetch feedback',
                error
              )
              setError(appError.userFriendlyMessage)
              return
            }

            setFeedback(data || [])
          } catch (err: any) {
            const appError = createError(
              ErrorType.UNKNOWN,
              'Unexpected error fetching feedback',
              err.message
            )
            setError(appError.userFriendlyMessage)
          } finally {
            setLoading(false)
          }
        },

        updateFeedbackStatus: async (feedbackId, status, notes) => {
          const { setUpdatingStatus, setError, fetchFeedback, setSelectedFeedback, setDeveloperNotes } = get()
          
          try {
            setUpdatingStatus(true)

            const { success, error } = await FeedbackService.updateFeedbackStatus(feedbackId, {
              status,
              developer_notes: notes
            })

            if (!success || error) {
              const appError = createError(
                ErrorType.DATABASE,
                'Failed to update feedback status',
                error
              )
              setError(appError.userFriendlyMessage)
              return
            }

            // Refresh the feedback list
            await fetchFeedback()
            setSelectedFeedback(null)
            setDeveloperNotes('')
          } catch (err: any) {
            const appError = createError(
              ErrorType.UNKNOWN,
              'Unexpected error updating feedback',
              err.message
            )
            setError(appError.userFriendlyMessage)
          } finally {
            setUpdatingStatus(false)
          }
        },

        clearFilters: () => {
          set({ 
            filters: {},
            filteredFeedback: get().feedback
          })
        },

        applyFilters: () => {
          const { feedback, filters } = get()
          const filteredFeedback = FeedbackService.filterFeedback(feedback, filters)
          set({ filteredFeedback })
        }
      }),
      {
        name: 'feedback-store',
        partialize: (state) => ({
          filters: state.filters,
          selectedFeedback: state.selectedFeedback,
          developerNotes: state.developerNotes
        })
      }
    ),
    {
      name: 'feedback-store'
    }
  )
)

// Selectors for better performance
export const useFeedbackSelectors = {
  useFeedback: () => useFeedbackStore((state) => state.feedback),
  useFilteredFeedback: () => useFeedbackStore((state) => state.filteredFeedback),
  useFilters: () => useFeedbackStore((state) => state.filters),
  useLoading: () => useFeedbackStore((state) => state.loading),
  useError: () => useFeedbackStore((state) => state.error),
  useSelectedFeedback: () => useFeedbackStore((state) => state.selectedFeedback),
  useDeveloperNotes: () => useFeedbackStore((state) => state.developerNotes),
  useUpdatingStatus: () => useFeedbackStore((state) => state.updatingStatus),
}

// Actions for easier access
export const useFeedbackActions = {
  useSetFeedback: () => useFeedbackStore((state) => state.setFeedback),
  useSetFilters: () => useFeedbackStore((state) => state.setFilters),
  useSetLoading: () => useFeedbackStore((state) => state.setLoading),
  useSetError: () => useFeedbackStore((state) => state.setError),
  useSetSelectedFeedback: () => useFeedbackStore((state) => state.setSelectedFeedback),
  useSetDeveloperNotes: () => useFeedbackStore((state) => state.setDeveloperNotes),
  useSetUpdatingStatus: () => useFeedbackStore((state) => state.setUpdatingStatus),
  useFetchFeedback: () => useFeedbackStore((state) => state.fetchFeedback),
  useUpdateFeedbackStatus: () => useFeedbackStore((state) => state.updateFeedbackStatus),
  useClearFilters: () => useFeedbackStore((state) => state.clearFilters),
  useApplyFilters: () => useFeedbackStore((state) => state.applyFilters),
} 