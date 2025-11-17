"use client"

import { useState, useEffect } from "react"
import { FeedbackLoginForm } from "@/components/feedback/FeedbackLoginForm"
import { FeedbackFilters } from "@/components/feedback/FeedbackFilters"
import { FeedbackList } from "@/components/feedback/FeedbackList"
import { FeedbackDetailModal } from "@/components/feedback/FeedbackDetailModal"
import { FeedbackHeader } from "@/components/feedback/FeedbackHeader"
import { FeedbackStats } from "@/components/feedback/FeedbackStats"
import { useFeedbackStore, useFeedbackSelectors, useFeedbackActions } from "@/store/FeedbackStore"
import { subscribeToErrors } from "@/lib/ErrorManager"
import { 
  isAuthorizedDeveloper, 
  saveDeveloperAuth, 
  getDeveloperAuth, 
  clearDeveloperAuth 
} from "@/lib/standalone-developer-config"

export default function RefactoredDeveloperFeedbackPage() {
  // State from store
  const {
    useFilteredFeedback,
    useLoading,
    useError,
    useSelectedFeedback,
    useDeveloperNotes,
    useUpdatingStatus
  } = useFeedbackSelectors

  const {
    useFetchFeedback,
    useUpdateFeedbackStatus,
    useSetSelectedFeedback,
    useSetDeveloperNotes,
    useSetError,
    useClearFilters
  } = useFeedbackActions

  const filteredFeedback = useFilteredFeedback()
  const loading = useLoading()
  const error = useError()
  const selectedFeedback = useSelectedFeedback()
  const developerNotes = useDeveloperNotes()
  const updatingStatus = useUpdatingStatus()

  const fetchFeedback = useFetchFeedback()
  const updateFeedbackStatus = useUpdateFeedbackStatus()
  const setSelectedFeedback = useSetSelectedFeedback()
  const setDeveloperNotes = useSetDeveloperNotes()
  const setError = useSetError()
  const clearFilters = useClearFilters()

  // Authentication state (could be moved to a separate auth store)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState("")
  const [authError, setAuthError] = useState("")

  // Error handling subscription
  useEffect(() => {
    const unsubscribe = subscribeToErrors((error) => {
      setError(error.userFriendlyMessage)
    })

    return unsubscribe
  }, [setError])

  // Check if already authenticated
  useEffect(() => {
    const savedAuth = getDeveloperAuth()
    if (savedAuth && savedAuth.authenticated) {
      setIsAuthenticated(true)
      setEmail(savedAuth.email)
      fetchFeedback()
    }
  }, [fetchFeedback])

  const handleLogin = (email: string, password: string) => {
    setAuthError("")
    
    if (isAuthorizedDeveloper(email, password)) {
      setIsAuthenticated(true)
      setEmail(email)
      saveDeveloperAuth(email)
      fetchFeedback()
    } else {
      setAuthError("Access denied. Only authorized developers can access this system.")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setEmail("")
    clearDeveloperAuth()
  }

  const handleUpdateStatus = async (feedbackId: string, status: string) => {
    await updateFeedbackStatus(feedbackId, status, developerNotes)
  }

  const handleClearFilters = () => {
    clearFilters()
  }

  // Login Form
  if (!isAuthenticated) {
    return (
      <FeedbackLoginForm 
        onLogin={handleLogin}
        authError={authError}
      />
    )
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <FeedbackHeader 
        email={email}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <FeedbackStats 
          totalCount={filteredFeedback.length}
          onRefresh={fetchFeedback}
        />

        <FeedbackFilters 
          onClearFilters={handleClearFilters}
        />

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading feedback...</p>
          </div>
        ) : (
          <FeedbackList 
            feedback={filteredFeedback}
            onSelectFeedback={setSelectedFeedback}
          />
        )}

        {selectedFeedback && (
          <FeedbackDetailModal
            feedback={selectedFeedback}
            developerNotes={developerNotes}
            updatingStatus={updatingStatus}
            onClose={() => setSelectedFeedback(null)}
            onUpdateStatus={handleUpdateStatus}
            onNotesChange={setDeveloperNotes}
          />
        )}
      </div>
    </div>
  )
} 