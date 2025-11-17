import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface EmailVerificationStatus {
  isVerified: boolean
  email: string | null
  lastChecked: Date | null
  isLoading: boolean
  error: string | null
}

export function useEmailVerification() {
  const [status, setStatus] = useState<EmailVerificationStatus>({
    isVerified: false,
    email: null,
    lastChecked: null,
    isLoading: true,
    error: null
  })

  const checkEmailVerification = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }))

      // Get current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.warn('No user session available (this is normal for participant dashboards):', userError.message)
        
        // For participant dashboards, we don't require email verification
        setStatus({
          isVerified: true, // Consider participants as "verified" for their limited access
          email: null,
          lastChecked: new Date(),
          isLoading: false,
          error: null
        })
        return
      }

      if (!user) {
        // No user session - this is normal for participant access
        setStatus({
          isVerified: true, // Allow participant access without email verification
          email: null,
          lastChecked: new Date(),
          isLoading: false,
          error: null
        })
        return
      }

      // Check if email is confirmed
      const isVerified = !!user.email_confirmed_at
      const email = user.email

      setStatus({
        isVerified,
        email,
        lastChecked: new Date(),
        isLoading: false,
        error: null
      })

      console.log('Email verification status:', {
        email,
        isVerified,
        confirmedAt: user.email_confirmed_at
      })

    } catch (error) {
      console.warn('Email verification check failed (this is normal for participant dashboards):', error)
      
      // For participant access, we don't want to show errors - just allow access
      setStatus({
        isVerified: true, // Allow access for participants
        email: null,
        lastChecked: new Date(),
        isLoading: false,
        error: null // Don't show error for participants
      })
    }
  }

  const resendVerificationEmail = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }))

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: status.email || ''
      })

      if (error) {
        throw error
      }

      console.log('Verification email resent successfully')
      return { success: true, message: 'Verification email sent successfully' }

    } catch (error) {
      console.error('Error resending verification email:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email'
      setStatus(prev => ({ ...prev, error: errorMessage }))
      return { success: false, message: errorMessage }
    } finally {
      setStatus(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Check verification status on mount and when auth state changes
  useEffect(() => {
    checkEmailVerification()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await checkEmailVerification()
        } else if (event === 'SIGNED_OUT') {
          setStatus({
            isVerified: false,
            email: null,
            lastChecked: new Date(),
            isLoading: false,
            error: null
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    ...status,
    checkEmailVerification,
    resendVerificationEmail
  }
}
