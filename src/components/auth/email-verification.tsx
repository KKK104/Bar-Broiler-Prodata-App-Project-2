"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Mail, CheckCircle, ArrowLeft, RefreshCw, Key } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface EmailVerificationProps {
  email: string
  onBack: () => void
  onVerified: () => Promise<void>
  isFromSignIn?: boolean
}

// Verification Code Input Component
function VerificationCodeInput({ 
  value, 
  onChange, 
  onComplete, 
  disabled = false 
}: { 
  value: string
  onChange: (value: string) => void
  onComplete: () => void
  disabled?: boolean
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleChange = (index: number, digit: string) => {
    if (digit.length > 1) return // Only allow single digits
    
    const newValue = value.split('')
    newValue[index] = digit
    const newCode = newValue.join('')
    
    onChange(newCode)
    
    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
      setFocusedIndex(index + 1)
    }
    
    // Check if code is complete
    if (newCode.length === 6) {
      onComplete()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (value[index]) {
        // Clear current digit
        const newValue = value.split('')
        newValue[index] = ''
        onChange(newValue.join(''))
      } else if (index > 0) {
        // Move to previous input
        inputRefs.current[index - 1]?.focus()
        setFocusedIndex(index - 1)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
      setFocusedIndex(index - 1)
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
      setFocusedIndex(index + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      onChange(pastedData)
      onComplete()
    }
  }

  return (
    <div className="flex justify-center space-x-2 mb-6">
      {Array.from({ length: 6 }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          disabled={disabled}
          className={`
            w-12 h-12 text-center text-lg font-bold border-2 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200
            ${focusedIndex === index 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}
          `}
        />
      ))}
    </div>
  )
}

export function EmailVerification({ email, onBack, onVerified, isFromSignIn = false }: EmailVerificationProps) {
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [message, setMessage] = useState("")
  const [isProcessingVerification, setIsProcessingVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [countdown, setCountdown] = useState(120) // 2 minutes = 120 seconds
  const { user, loading, authError, resendEmailVerification, sendOTP, verifyOTP, clearAuthError } = useAuth()

  // Check if user becomes verified
  useEffect(() => {
    if (!loading && user?.email_confirmed_at && !isProcessingVerification) {
      setIsProcessingVerification(true)
      onVerified().finally(() => {
        setIsProcessingVerification(false)
      })
    }
  }, [user, loading, onVerified, isProcessingVerification])

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      setMessage(authError)
      clearAuthError()
    }
  }, [authError, clearAuthError])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // 2-minute countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Send OTP code when component mounts
  useEffect(() => {
    if (email && !isResending && resendCooldown === 0) {
      handleResendEmail()
    }
  }, [email]) // Only run once when email is available

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    setMessage("")

    try {
      const { error } = await sendOTP(email)
      
      if (error) {
        setMessage("Failed to resend verification code. Please try again.")
      } else {
        setMessage("Verification code sent! Please check your inbox.")
        setResendCooldown(60) // 60 second cooldown
        setCountdown(120) // Reset 2-minute countdown
      }
    } catch (error) {
      setMessage("Failed to resend verification code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) return
    
    setIsVerifyingCode(true)
    setMessage("")

    try {
      // Use real OTP verification with Supabase
      const { data, error } = await verifyOTP(email, verificationCode)
      
      if (error) {
        setMessage("Invalid verification code. Please try again.")
        setVerificationCode("")
      } else {
        // If verification is successful, trigger the onVerified callback
        await onVerified()
      }
    } catch (error) {
      setMessage("Invalid verification code. Please try again.")
      setVerificationCode("")
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleCodeComplete = () => {
    if (verificationCode.length === 6) {
      handleVerifyCode()
    }
  }

  // Show loading state when processing verification
  if (isProcessingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-gray-600">
                Processing your account setup...
              </p>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-center space-x-3 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Loading farm data</span>
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="flex items-center justify-center space-x-3 text-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Checking setup progress</span>
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="flex items-center justify-center space-x-3 text-sm">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Preparing your dashboard</span>
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-gray-600">
              We've sent a verification code to:
            </p>
            <p className="font-medium text-gray-900 mt-1">{email}</p>
          </div>

          {/* Countdown Timer */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-orange-700 dark:text-orange-300 text-sm font-medium">
                Code expires in: {formatCountdown(countdown)}
              </span>
            </div>
          </div>

          {/* Verification Code Input */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4 text-center">
              Enter the 6-digit verification code from your email:
            </p>
            
            {/* 6-Digit Input */}
            <div className="flex justify-center space-x-2 mb-4">
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={verificationCode[index] || ''}
                  onChange={(e) => {
                    const newValue = verificationCode.split('')
                    newValue[index] = e.target.value
                    setVerificationCode(newValue.join(''))
                  }}
                  className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                  placeholder="0"
                />
              ))}
            </div>
            
            {isVerifyingCode && (
              <div className="flex items-center justify-center space-x-2 text-blue-600 mt-4">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Verifying code...</span>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              We've sent a verification code to your email. Enter the 6-digit code above to verify your account and access your dashboard.
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-lg border ${
              message.includes('sent') || message.includes('success') 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-sm ${
                message.includes('sent') || message.includes('success') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>{message}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleVerifyCode}
              disabled={verificationCode.length !== 6 || isVerifyingCode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium rounded-xl"
            >
              {isVerifyingCode ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            
            <Button 
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-medium rounded-xl"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Code
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onBack}
              className="w-full text-gray-600 hover:text-gray-700 h-12 text-base font-medium rounded-xl border-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isFromSignIn ? 'Back to Sign In' : 'Back to Sign Up'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={async () => await onVerified()}
              className="w-full text-gray-600 hover:text-gray-700 h-12 text-base font-medium rounded-xl border-2"
            >
              Skip for Now - Go to Dashboard
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Didn't receive the code? Check your spam folder or try resending.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}