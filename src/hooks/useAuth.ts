import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    // Handle URL error parameters (like OTP expiration)
    const handleUrlErrors = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.hash.substring(1))
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')
        
        if (error) {
          console.error('Auth error from URL:', error, errorDescription)
          
          // Handle specific error cases
          if (error === 'access_denied' && errorDescription?.includes('expired')) {
            setAuthError('Email verification link has expired. Please request a new one.')
          } else if (error === 'access_denied') {
            setAuthError('Access denied. Please try signing up again.')
          } else {
            setAuthError(errorDescription || 'Authentication error occurred.')
          }
          
          // Clear the error from URL
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    }

    // Check for URL errors first
    handleUrlErrors()

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Initial session check:', session?.user?.email || 'No session')
        
        if (error) {
          console.error('Error getting session:', error)
          setAuthError('Failed to check authentication status.')
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthError('Authentication system error.')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email || 'No user')
        
        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          setAuthError(null) // Clear any previous errors
        } else if (event === 'SIGNED_OUT') {
          setAuthError(null)
        } else if (event === 'TOKEN_REFRESHED') {
          setAuthError(null)
        }
        
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Add the signIn function
  const signIn = async (email: string, password: string) => {
    try {
      setAuthError(null) // Clear previous errors
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      })

      if (error) {
        console.error('Sign in error:', error)
        setAuthError(error.message)
        return { data: null, error, isEmailVerified: false }
      }

      // Check email verification status
      const isEmailVerified = !!data.user?.email_confirmed_at
      
      console.log('Sign in successful:', data.user?.email, 'Email verified:', isEmailVerified)
      return { data, error: null, isEmailVerified }
    } catch (error) {
      console.error('Sign in error:', error)
      setAuthError('Network error. Please try again.')
      return { data: null, error, isEmailVerified: false }
    }
  }

  // Add the signUp function
  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setAuthError(null) // Clear previous errors
      
      // Get the current URL for redirect
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : ''
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: metadata || {},
          emailRedirectTo: redirectUrl
        }
      })

      if (error) {
        console.error('Sign up error:', error)
        setAuthError(error.message)
        return { data: null, error }
      }

      console.log('Sign up successful:', data.user?.email)
      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      setAuthError('Network error. Please try again.')
      return { data: null, error }
    }
  }

  // Add resend email verification function
  const resendEmailVerification = async (email?: string) => {
    try {
      setAuthError(null)
      const emailToUse = email || user?.email
      
      if (!emailToUse) {
        throw new Error('No email provided for verification')
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse.trim()
      })

      if (error) {
        console.error('Resend email error:', error)
        setAuthError(error.message)
        return { error }
      }

      console.log('Email verification resent to:', emailToUse)
      return { error: null }
    } catch (error) {
      console.error('Resend email error:', error)
      setAuthError('Failed to resend verification email.')
      return { error }
    }
  }

  // Add OTP verification functions
  const sendOTP = async (email: string) => {
    try {
      setAuthError(null)
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : ''
        }
      })

      if (error) {
        console.error('Send OTP error:', error)
        setAuthError(error.message)
        return { error }
      }

      console.log('OTP sent to:', email)
      return { error: null }
    } catch (error) {
      console.error('Send OTP error:', error)
      setAuthError('Failed to send verification code.')
      return { error }
    }
  }

  const verifyOTP = async (email: string, token: string) => {
    try {
      setAuthError(null)
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'email'
      })

      if (error) {
        console.error('Verify OTP error:', error)
        setAuthError(error.message)
        return { data: null, error }
      }

      console.log('OTP verified successfully for:', email)
      return { data, error: null }
    } catch (error) {
      console.error('Verify OTP error:', error)
      setAuthError('Failed to verify code.')
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setAuthError(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const clearAuthError = () => {
    setAuthError(null)
  }

  return { 
    user, 
    loading, 
    authError,
    signIn, 
    signUp, 
    signOut, 
    resendEmailVerification,
    sendOTP,
    verifyOTP,
    clearAuthError
  }
}