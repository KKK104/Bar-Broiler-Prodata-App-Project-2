"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Mail, X, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface VerificationBannerProps {
  email: string
  onDismiss?: () => void
}

export function VerificationBanner({ email, onDismiss }: VerificationBannerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const { resendEmailVerification } = useAuth()

  const handleResendEmail = async () => {
    setIsLoading(true)
    setMessage("")
    
    try {
      await resendEmailVerification(email)
      setMessage("Verification email sent! Please check your inbox.")
    } catch (error) {
      setMessage("Failed to send verification email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Email Verification Required
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please verify your email address ({email}) to access all dashboard features.
            </p>
            {message && (
              <p className={`text-sm mt-2 ${message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
            <div className="mt-3">
              <Button
                onClick={handleResendEmail}
                disabled={isLoading}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                {isLoading ? "Sending..." : "Resend Verification Email"}
              </Button>
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-yellow-400 hover:text-yellow-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
