"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { 
  hasWelcomeModalBeenShown, 
  markWelcomeModalAsShown,
  getUserOnboardingStatus 
} from "@/lib/user-verification"

interface WelcomeModalProps {
  isVisible: boolean
  onClose: () => void
  onStartTour: () => void
  userId?: string
  userEmail?: string
}

export function WelcomeModal({ 
  isVisible, 
  onClose, 
  onStartTour, 
  userId, 
  userEmail 
}: WelcomeModalProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasBeenShown, setHasBeenShown] = useState(false)
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null)

  // Check if this modal has already been shown for this user (database-based)
  useEffect(() => {
    if (isVisible && userId && !hasBeenShown) {
      checkWelcomeModalStatus()
    }
  }, [isVisible, userId, hasBeenShown])

  const checkWelcomeModalStatus = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      // Get comprehensive onboarding status from database
      const statusResult = await getUserOnboardingStatus(userId)
      
      if (statusResult.success && statusResult.data) {
        setOnboardingStatus(statusResult.data)
        
        if (statusResult.data.hasSeenWelcomeModal) {
          // User has already seen this modal, close it
          console.log('🚫 Welcome modal already shown for user:', userId)
          onClose()
          return
        }
        
        // User hasn't seen the modal yet, show it
        console.log('✅ Showing welcome modal for user:', userId)
        setHasBeenShown(true)
      } else {
        console.error('❌ Error checking welcome modal status:', statusResult.error)
        // Fallback: show modal if we can't determine status
        setHasBeenShown(true)
      }
    } catch (error) {
      console.error('❌ Exception checking welcome modal status:', error)
      // Fallback: show modal if there's an error
      setHasBeenShown(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to reset welcome modal for testing (development only)
  const resetWelcomeModal = async () => {
    if (userId) {
      try {
        // Clear localStorage as backup
        localStorage.removeItem(`welcome_shown_${userId}`)
        localStorage.removeItem(`welcome_shown_${userEmail}`)
        
        // Reset database status (this would require a new function)
        console.log('🔄 Welcome modal reset for testing')
        setHasBeenShown(false)
        setOnboardingStatus(null)
      } catch (error) {
        console.error('❌ Error resetting welcome modal:', error)
      }
    }
  }

  // Expose reset function for testing (development only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resetWelcomeModal = resetWelcomeModal
    }
  }, [userId, userEmail])

  const handleGetStarted = async () => {
    setIsClosing(true)
    
    // Mark welcome modal as shown in database
    if (userId) {
      try {
        const result = await markWelcomeModalAsShown(userId)
        if (result.success) {
          console.log('✅ Welcome modal marked as shown in database')
        } else {
          console.error('❌ Error marking welcome modal as shown:', result.error)
        }
      } catch (error) {
        console.error('❌ Exception marking welcome modal as shown:', error)
      }
    }
    
    // Close modal after animation
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const handleTakeTour = async () => {
    setIsClosing(true)
    
    // Mark welcome modal as shown in database
    if (userId) {
      try {
        const result = await markWelcomeModalAsShown(userId)
        if (result.success) {
          console.log('✅ Welcome modal marked as shown in database')
        } else {
          console.error('❌ Error marking welcome modal as shown:', result.error)
        }
      } catch (error) {
        console.error('❌ Exception marking welcome modal as shown:', error)
      }
    }
    
    // Start tour after animation
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      onStartTour()
    }, 300)
  }

  // Don't show modal if loading or if it's been determined that it shouldn't show
  if (!isVisible || isLoading) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        exit={{ opacity: 0 }}
        className="fixed top-4 right-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, x: 100 }}
          animate={{ 
            scale: isClosing ? 0.8 : 1, 
            opacity: isClosing ? 0 : 1,
            x: isClosing ? 100 : 0
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm text-center"
        >
          {/* Sparkle Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-bold text-gray-900 dark:text-white mb-3"
          >
            Welcome to Your Farm! 🎉
          </motion.h2>
          
          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-gray-600 dark:text-gray-300 mb-4"
          >
            Your farm is now set up and ready to go. Start exploring the dashboard to manage your operations.
          </motion.p>
          
          {/* Debug Info (development only) */}
          {onboardingStatus && process.env.NODE_ENV === 'development' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs"
            >
              <div>Verified: {onboardingStatus.isVerified ? '✅' : '❌'}</div>
              <div>New User: {onboardingStatus.isNewUser ? '✅' : '❌'}</div>
              <div>Onboarding Complete: {onboardingStatus.hasCompletedOnboarding ? '✅' : '❌'}</div>
            </motion.div>
          )}
          
          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <Button
              onClick={handleGetStarted}
              size="sm"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Get Started
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleTakeTour}
              className="w-full"
            >
              Take a Tour
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
