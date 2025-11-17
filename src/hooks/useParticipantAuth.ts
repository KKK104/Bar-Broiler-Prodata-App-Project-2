import { useState, useEffect } from 'react'

/**
 * Simplified authentication hook for participant dashboards
 * Participants don't need full user accounts or email verification
 */
export function useParticipantAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [participantInfo, setParticipantInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For participants, we just check if they have valid participant data
    // This could be from localStorage, URL params, or other participant-specific auth
    
    const checkParticipantAuth = () => {
      try {
        // Check if this is a participant session (you might store this differently)
        const participantData = localStorage.getItem('participantSession')
        
        if (participantData) {
          const parsed = JSON.parse(participantData)
          setParticipantInfo(parsed)
          setIsAuthenticated(true)
        } else {
          // For now, assume participant is authenticated if they reached this dashboard
          // In a real app, you'd validate their participant code/token
          setIsAuthenticated(true)
          setParticipantInfo({ 
            name: 'Worker', 
            type: 'participant',
            requiresEmailVerification: false 
          })
        }
      } catch (error) {
        console.warn('Participant auth check failed:', error)
        // Still allow access for participants
        setIsAuthenticated(true)
        setParticipantInfo({ 
          name: 'Worker', 
          type: 'participant',
          requiresEmailVerification: false 
        })
      } finally {
        setLoading(false)
      }
    }

    checkParticipantAuth()
  }, [])

  return {
    isAuthenticated,
    participantInfo,
    loading,
    // Participants are always considered "verified" for their limited access
    isEmailVerified: true,
    requiresEmailVerification: false
  }
}

