"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { sessionManager } from '@/lib/session'

interface SessionTimeoutWarningProps {
  onSessionExpired: () => void
}

export function SessionTimeoutWarning({ onSessionExpired }: SessionTimeoutWarningProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)

  useEffect(() => {
    const checkSession = () => {
      const remaining = sessionManager.getRemainingTime()
      
      if (remaining <= 0) {
        // Session expired
        onSessionExpired()
        return
      }
      
      if (remaining <= 5) { // Show warning 5 minutes before expiry
        setShowWarning(true)
        setRemainingTime(remaining)
      } else {
        setShowWarning(false)
      }
    }

    // Check immediately
    checkSession()
    
    // Check every minute
    const interval = setInterval(checkSession, 60000)
    
    return () => clearInterval(interval)
  }, [onSessionExpired])

  const handleExtendSession = () => {
    const session = sessionManager.getSession()
    if (session) {
      // Extend session by saving it again
      const { expiresAt, ...sessionData } = session
      sessionManager.saveSession(sessionData)
      setShowWarning(false)
    }
  }

  const handleLogout = () => {
    sessionManager.clearSession()
    onSessionExpired()
  }

  if (!showWarning) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Session Expiring Soon
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            Your session will expire in {remainingTime} minute{remainingTime !== 1 ? 's' : ''}.
          </p>
          <div className="mt-3 flex space-x-2">
            <Button
              size="sm"
              onClick={handleExtendSession}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Stay Logged In
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 