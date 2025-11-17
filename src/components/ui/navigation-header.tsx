"use client"

import { Button } from "@/components/ui/button"
import { FeedbackButton } from "@/components/feedback/feedback-button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { EmailVerificationIndicator } from "@/components/auth/EmailVerificationIndicator"
import { HumidityNavDisplay } from "@/components/humidity/HumidityNavDisplay"
import { Home, LogOut, Menu, X, Droplets } from "lucide-react"
import { useState } from "react"

interface NavigationHeaderProps {
  title: string
  subtitle?: string
  userEmail?: string
  farmId?: string
  userId?: string
  onHomeClick: () => void
  onSignOut: () => void
  onHumidityClick?: () => void
  className?: string
}

export function NavigationHeader({
  title,
  subtitle,
  userEmail,
  farmId,
  userId,
  onHomeClick,
  onSignOut,
  onHumidityClick,
  className = ""
}: NavigationHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Debug logging
  console.log('NavigationHeader props:', { 
    onHumidityClick: typeof onHumidityClick, 
    onHumidityClickValue: onHumidityClick,
    userEmail, 
    farmId 
  })
  
  // Test if the function is being passed
  console.log('NavigationHeader received onHumidityClick:', onHumidityClick)
  console.log('NavigationHeader onHumidityClick type:', typeof onHumidityClick)
  console.log('NavigationHeader onHumidityClick === undefined:', onHumidityClick === undefined)

  return (
    <div className={`bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <Home className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <EmailVerificationIndicator />
            <ThemeToggle />
            {userId && (
              <HumidityNavDisplay 
                userId={userId}
                onOpenModal={onHumidityClick}
              />
            )}
            {!userId && onHumidityClick && (
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('Humidity button clicked!')
                  console.log('onHumidityClick type:', typeof onHumidityClick)
                  console.log('onHumidityClick value:', onHumidityClick)
                  if (onHumidityClick) {
                    onHumidityClick()
                  } else {
                    console.log('No humidity click handler provided')
                  }
                }}
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Droplets className="w-4 h-4 mr-2" />
                Humidity
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={onHomeClick}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="outline"
              onClick={onSignOut}
              size="sm"
              className="text-red-600 hover:text-red-700 text-xs sm:text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            <FeedbackButton 
              userEmail={userEmail}
              farmId={farmId}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <div>
                              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
              {subtitle && (
                <p className="text-xs text-gray-600 dark:text-gray-300">{subtitle}</p>
              )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
                {userId && (
                  <div className="w-full">
                    <HumidityNavDisplay 
                      userId={userId}
                      onOpenModal={onHumidityClick}
                      className="w-full justify-center"
                    />
                  </div>
                )}
                {!userId && onHumidityClick && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      console.log('Mobile humidity button clicked!')
                      console.log('onHumidityClick type:', typeof onHumidityClick)
                      console.log('onHumidityClick value:', onHumidityClick)
                      if (onHumidityClick) {
                        onHumidityClick()
                      } else {
                        console.log('No humidity click handler provided (mobile)')
                      }
                    }}
                    size="sm"
                    className="w-full justify-center text-sm"
                  >
                    <Droplets className="w-4 h-4 mr-2" />
                    Humidity
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={onHomeClick}
                  size="sm"
                  className="w-full justify-center text-sm"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
                <Button
                  variant="outline"
                  onClick={onSignOut}
                  size="sm"
                  className="w-full justify-center text-red-600 hover:text-red-700 text-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
                <FeedbackButton 
                  userEmail={userEmail}
                  farmId={farmId}
                  variant="outline"
                  size="sm"
                  className="w-full justify-center text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
