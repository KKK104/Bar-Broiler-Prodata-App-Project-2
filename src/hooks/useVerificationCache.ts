import { useState, useEffect } from 'react'

interface VerificationStatus {
  email_verified: boolean
  has_data: boolean
  is_new_user: boolean
  last_checked: string
}

interface UseVerificationCacheProps {
  userEmail: string | undefined
  participantsCount: number
  buildingsCount: number
  participantsLoading: boolean
  buildingsLoading: boolean
}

export function useVerificationCache({
  userEmail,
  participantsCount,
  buildingsCount,
  participantsLoading,
  buildingsLoading
}: UseVerificationCacheProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get cached verification status from localStorage
  const getCachedStatus = async (email: string): Promise<VerificationStatus | null> => {
    try {
      const cacheKey = `verification_status_${email}`
      const cached = localStorage.getItem(cacheKey)
      
      if (cached) {
        const status = JSON.parse(cached) as VerificationStatus
        return status
      }

      return null
    } catch (err) {
      console.error('Error in getCachedStatus:', err)
      return null
    }
  }

  // Update cached verification status in localStorage
  const updateCachedStatus = async (
    email: string,
    emailVerified: boolean,
    hasData: boolean,
    isNewUser: boolean
  ) => {
    try {
      const cacheKey = `verification_status_${email}`
      const status: VerificationStatus = {
        email_verified: emailVerified,
        has_data: hasData,
        is_new_user: isNewUser,
        last_checked: new Date().toISOString()
      }
      
      localStorage.setItem(cacheKey, JSON.stringify(status))
      console.log('✅ Verification status cached successfully in localStorage')
    } catch (err) {
      console.error('Error in updateCachedStatus:', err)
    }
  }

  // Check if cached status is still valid (within 1 hour)
  const isCachedStatusValid = (status: VerificationStatus): boolean => {
    const lastChecked = new Date(status.last_checked)
    const now = new Date()
    const hoursDiff = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 1 // Cache valid for 1 hour
  }

  // Main effect to handle verification caching
  useEffect(() => {
    if (!userEmail) {
      setLoading(false)
      return
    }

    const checkVerificationStatus = async () => {
      setLoading(true)
      setError(null)

      try {
        // First, try to get cached status
        const cachedStatus = await getCachedStatus(userEmail)

        if (cachedStatus && isCachedStatusValid(cachedStatus)) {
          // Use cached status if it's still valid
          console.log('✅ Using cached verification status:', cachedStatus)
          setVerificationStatus(cachedStatus)
          setLoading(false)
          return
        }

        // If no cached status or it's expired, calculate current status
        console.log('🔄 Calculating current verification status...')
        
        // Wait for data to finish loading
        if (participantsLoading || buildingsLoading) {
          console.log('Data still loading, will check again...')
          setLoading(false)
          return
        }

        // Calculate current status
        const emailVerified = true // Assuming user is authenticated
        const hasData = participantsCount > 0 || buildingsCount > 0
        const isNewUser = !hasData

        const currentStatus: VerificationStatus = {
          email_verified: emailVerified,
          has_data: hasData,
          is_new_user: isNewUser,
          last_checked: new Date().toISOString()
        }

        // Cache the current status
        await updateCachedStatus(userEmail, emailVerified, hasData, isNewUser)

        // Set the status
        setVerificationStatus(currentStatus)
        console.log('✅ Verification status calculated and cached:', currentStatus)

      } catch (err) {
        console.error('Error checking verification status:', err)
        setError('Failed to check verification status')
      } finally {
        setLoading(false)
      }
    }

    checkVerificationStatus()
  }, [userEmail, participantsCount, buildingsCount, participantsLoading, buildingsLoading])

  // Function to force refresh the cache
  const refreshCache = async () => {
    if (!userEmail) return

    try {
      // Clear cached status by updating with current data
      const hasData = participantsCount > 0 || buildingsCount > 0
      const isNewUser = !hasData

      await updateCachedStatus(userEmail, true, hasData, isNewUser)

      // Update local state
      setVerificationStatus({
        email_verified: true,
        has_data: hasData,
        is_new_user: isNewUser,
        last_checked: new Date().toISOString()
      })

      console.log('✅ Verification cache refreshed')
    } catch (err) {
      console.error('Error refreshing cache:', err)
    }
  }

  return {
    verificationStatus,
    loading,
    error,
    refreshCache
  }
}
