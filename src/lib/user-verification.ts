import { supabase } from './supabase'

export interface UserVerificationStatus {
  user_id: string
  email: string
  is_verified: boolean
  verified_at: string | null
  is_new_user: boolean
  has_completed_onboarding: boolean
  onboarding_completed_at: string | null
}

/**
 * Mark a user as verified in the database
 */
export async function markUserVerified(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔐 Marking user as verified:', userId)
    
    const { data, error } = await supabase.rpc('mark_user_verified', {
      user_uuid: userId
    })
    
    if (error) {
      console.error('❌ Error marking user as verified:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ User marked as verified successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Exception marking user as verified:', error)
    return { success: false, error: 'Failed to mark user as verified' }
  }
}

/**
 * Mark user onboarding as complete
 */
export async function markUserOnboardingComplete(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🎯 Marking user onboarding as complete:', userId)
    
    const { data, error } = await supabase.rpc('mark_user_onboarding_complete', {
      user_uuid: userId
    })
    
    if (error) {
      console.error('❌ Error marking onboarding complete:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ User onboarding marked as complete')
    return { success: true }
  } catch (error) {
    console.error('❌ Exception marking onboarding complete:', error)
    return { success: false, error: 'Failed to mark onboarding as complete' }
  }
}

/**
 * Get user verification status from database
 */
export async function getUserVerificationStatus(userId: string): Promise<{ 
  success: boolean; 
  data?: UserVerificationStatus; 
  error?: string 
}> {
  try {
    console.log('🔍 Getting user verification status:', userId)
    
    const { data, error } = await supabase.rpc('get_user_verification_status', {
      user_uuid: userId
    })
    
    if (error) {
      console.error('❌ Error getting user verification status:', error)
      return { success: false, error: error.message }
    }
    
    if (!data || data.length === 0) {
      console.log('📝 No verification record found for user, creating one...')
      // Create a new verification record
      const { data: insertData, error: insertError } = await supabase
        .from('user_verification_status')
        .insert([{
          user_id: userId,
          email: '', // Will be filled by the database function
          is_verified: false,
          is_new_user: true,
          has_completed_onboarding: false
        }])
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ Error creating verification record:', insertError)
        return { success: false, error: insertError.message }
      }
      
      return { success: true, data: insertData as UserVerificationStatus }
    }
    
    console.log('✅ User verification status retrieved:', data[0])
    return { success: true, data: data[0] as UserVerificationStatus }
  } catch (error) {
    console.error('❌ Exception getting user verification status:', error)
    return { success: false, error: 'Failed to get user verification status' }
  }
}

/**
 * Check if user is truly new based on database verification status
 */
export async function isUserTrulyNewFromDatabase(userId: string): Promise<{ 
  success: boolean; 
  isTrulyNew: boolean; 
  error?: string 
}> {
  try {
    const result = await getUserVerificationStatus(userId)
    
    if (!result.success) {
      return { success: false, isTrulyNew: false, error: result.error }
    }
    
    const verificationStatus = result.data!
    const isTrulyNew = verificationStatus.is_new_user && verificationStatus.is_verified
    
    console.log('🔍 Database newness check:', {
      userId,
      isNewUser: verificationStatus.is_new_user,
      isVerified: verificationStatus.is_verified,
      isTrulyNew
    })
    
    return { success: true, isTrulyNew }
  } catch (error) {
    console.error('❌ Exception checking user newness from database:', error)
    return { success: false, isTrulyNew: false, error: 'Failed to check user newness' }
  }
}

/**
 * Update user verification status when email is verified
 */
export async function updateUserVerificationOnEmailConfirm(userId: string): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  try {
    console.log('📧 Updating user verification on email confirm:', userId)
    
    // Mark user as verified
    const verifyResult = await markUserVerified(userId)
    if (!verifyResult.success) {
      return verifyResult
    }
    
    // Get updated verification status
    const statusResult = await getUserVerificationStatus(userId)
    if (!statusResult.success) {
      return statusResult
    }
    
    console.log('✅ User verification updated on email confirm:', statusResult.data)
    return { success: true }
  } catch (error) {
    console.error('❌ Exception updating verification on email confirm:', error)
    return { success: false, error: 'Failed to update verification status' }
  }
}

/**
 * Complete user onboarding (mark as not new)
 */
export async function completeUserOnboarding(userId: string): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  try {
    console.log('🎉 Completing user onboarding:', userId)
    
    const result = await markUserOnboardingComplete(userId)
    if (!result.success) {
      return result
    }
    
    console.log('✅ User onboarding completed successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Exception completing user onboarding:', error)
    return { success: false, error: 'Failed to complete user onboarding' }
  }
}

/**
 * Check if welcome modal has been shown for a user (database-based)
 */
export async function hasWelcomeModalBeenShown(userId: string): Promise<{ 
  success: boolean; 
  hasBeenShown: boolean; 
  error?: string 
}> {
  try {
    console.log('🔍 Checking if welcome modal has been shown for user:', userId)
    
    const result = await getUserVerificationStatus(userId)
    
    if (!result.success) {
      return { success: false, hasBeenShown: false, error: result.error }
    }
    
    const verificationStatus = result.data!
    const hasBeenShown = verificationStatus.has_completed_onboarding
    
    console.log('🔍 Welcome modal check result:', {
      userId,
      hasCompletedOnboarding: verificationStatus.has_completed_onboarding,
      hasBeenShown
    })
    
    return { success: true, hasBeenShown }
  } catch (error) {
    console.error('❌ Exception checking welcome modal status:', error)
    return { success: false, hasBeenShown: false, error: 'Failed to check welcome modal status' }
  }
}

/**
 * Mark welcome modal as shown in database
 */
export async function markWelcomeModalAsShown(userId: string): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  try {
    console.log('✅ Marking welcome modal as shown for user:', userId)
    
    const result = await completeUserOnboarding(userId)
    if (!result.success) {
      return result
    }
    
    console.log('✅ Welcome modal marked as shown in database')
    return { success: true }
  } catch (error) {
    console.error('❌ Exception marking welcome modal as shown:', error)
    return { success: false, error: 'Failed to mark welcome modal as shown' }
  }
}

/**
 * Get comprehensive user verification and onboarding status
 */
export async function getUserOnboardingStatus(userId: string): Promise<{ 
  success: boolean; 
  data?: {
    isVerified: boolean
    isNewUser: boolean
    hasCompletedOnboarding: boolean
    hasSeenWelcomeModal: boolean
    verifiedAt: string | null
    onboardingCompletedAt: string | null
  }; 
  error?: string 
}> {
  try {
    console.log('🔍 Getting comprehensive onboarding status for user:', userId)
    
    const result = await getUserVerificationStatus(userId)
    
    if (!result.success) {
      return { success: false, error: result.error }
    }
    
    const verificationStatus = result.data!
    
    const onboardingStatus = {
      isVerified: verificationStatus.is_verified,
      isNewUser: verificationStatus.is_new_user,
      hasCompletedOnboarding: verificationStatus.has_completed_onboarding,
      hasSeenWelcomeModal: verificationStatus.has_completed_onboarding, // Same as onboarding completion
      verifiedAt: verificationStatus.verified_at,
      onboardingCompletedAt: verificationStatus.onboarding_completed_at
    }
    
    console.log('🔍 Comprehensive onboarding status:', {
      userId,
      ...onboardingStatus
    })
    
    return { success: true, data: onboardingStatus }
  } catch (error) {
    console.error('❌ Exception getting onboarding status:', error)
    return { success: false, error: 'Failed to get onboarding status' }
  }
}
