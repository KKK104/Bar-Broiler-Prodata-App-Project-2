"use client"

import { Button } from "@/components/ui/button"
import { MessageSquare, Lock, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"

interface FeedbackHeaderProps {
  email: string
  onLogout: () => void
}

export function FeedbackHeader({ email, onLogout }: FeedbackHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Developer Feedback Management
              </h1>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Secure Access
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Logged in as: {email}
            </div>
            <Button
              variant="outline"
              onClick={onLogout}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900">
                Feedback Management
              </h1>
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
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
              <div className="flex flex-col space-y-2">
                <div className="text-sm text-gray-600">
                  Logged in as: {email}
                </div>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                  <Lock className="w-3 h-3" />
                  Secure Access
                </span>
                <Button
                  variant="outline"
                  onClick={onLogout}
                  className="w-full justify-center text-red-600 hover:text-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 