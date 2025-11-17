"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../ui/button"
import { X, ChevronLeft, ChevronRight, SkipForward } from "lucide-react"

interface ProductTourProps {
  isNewUser?: boolean
  onComplete?: () => void
}

interface TourStep {
  target: string
  content: string
  title: string
}

export function ProductTour({ isNewUser = false, onComplete }: ProductTourProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const steps: TourStep[] = [
    {
      target: '.dashboard-welcome',
      title: 'Welcome to Your Farm Dashboard!',
      content: '🎉 Your email has been verified and you\'re all set. Let\'s take a quick tour to get you started with managing your farm.',
    },
    {
      target: '.add-building-card',
      title: 'Add Your Buildings',
      content: '🏢 Start by adding your buildings. Click "Add Building" to set up your farm structure and begin tracking performance.',
    },
    {
      target: '.add-staff-card',
      title: 'Add Your Team',
      content: '👥 Next, add your team members. Click "Add Staff" to invite people who will help manage your farm operations.',
    },
    {
      target: '.dashboard-overview',
      title: 'You\'re All Set!',
      content: '✅ Great! You now know the basics. You can always access help and settings from the navigation menu.',
    }
  ]

  // Traditional approach: Check localStorage once on mount
  useEffect(() => {
    // Only show tour for new users who haven't seen it before
    if (isNewUser) {
      const hasSeenTour = localStorage.getItem('hasSeenProductTour')
      
      if (!hasSeenTour) {
        // Small delay to ensure page is fully loaded
        const timer = setTimeout(() => {
          setIsActive(true)
        }, 1000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [isNewUser])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    completeTour()
  }

  const completeTour = () => {
    // Mark tour as completed
    localStorage.setItem('hasSeenProductTour', 'true')
    
    setIsActive(false)
    setCurrentStep(0)
    
    if (onComplete) {
      onComplete()
    }
  }

  // Don't render anything if tour is not active
  if (!isActive) {
    return null
  }

  return (
    <>
      {/* Non-blocking floating tooltip - no overlay */}
      <AnimatePresence>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed z-[10001] top-4 right-4 max-w-sm w-full mx-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {steps[currentStep].title}
                </h3>
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                {steps[currentStep].content}
              </p>

              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <div className="flex space-x-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          index === currentStep
                            ? 'bg-blue-500'
                            : index < currentStep
                            ? 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                  className="text-xs"
                >
                  <SkipForward className="w-3 h-3 mr-1" />
                  Skip
                </Button>

                <div className="flex items-center space-x-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      className="text-xs"
                    >
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      Prev
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {currentStep === steps.length - 1 ? (
                      'Done'
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
