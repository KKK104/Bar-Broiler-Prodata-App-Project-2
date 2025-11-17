// Session management utilities
export interface ParticipantSession {
  id: string
  name: string
  code: string
  access_tools: string[]
  farm_id: string
  expiresAt: number // Unix timestamp
}

const SESSION_KEY = 'participant_session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export const sessionManager = {
  // Save participant session with expiration
  saveSession: (participant: Omit<ParticipantSession, 'expiresAt'>) => {
    if (typeof window === 'undefined') return false
    
    try {
      const session: ParticipantSession = {
        ...participant,
        expiresAt: Date.now() + SESSION_DURATION
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      return true
    } catch (error) {
      console.error('Failed to save session:', error)
      return false
    }
  },

  // Get valid participant session
  getSession: (): ParticipantSession | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (!stored) return null
      
      const session: ParticipantSession = JSON.parse(stored)
      
      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        sessionManager.clearSession()
        return null
      }
      
      return session
    } catch (error) {
      console.error('Failed to get session:', error)
      sessionManager.clearSession()
      return null
    }
  },

  // Clear session
  clearSession: () => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch (error) {
      console.error('Failed to clear session:', error)
    }
  },

  // Check if session is valid
  isValidSession: (): boolean => {
    return sessionManager.getSession() !== null
  },

  // Get remaining time in minutes
  getRemainingTime: (): number => {
    const session = sessionManager.getSession()
    if (!session) return 0
    
    const remaining = session.expiresAt - Date.now()
    return Math.max(0, Math.floor(remaining / (60 * 1000)))
  }
} 