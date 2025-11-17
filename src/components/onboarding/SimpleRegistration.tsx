"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent } from "../ui/card"
import { User, Mail, ArrowRight, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import React from "react"


interface SimpleRegistrationProps {
  onBack: () => void
  onSuccess: () => void
}

export function SimpleRegistration({ onBack, onSuccess }: SimpleRegistrationProps) {
  const [step, setStep] = useState<'registration' | 'verification'>('registration')
  const [formData, setFormData] = useState({
    farmName: '',
    ownerName: '',
    email: '',
    password: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [verificationCode, setVerificationCode] = useState("")
  const [countdown, setCountdown] = useState(120) // 2 minutes = 120 seconds
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  
  const { signUp, resendEmailVerification, sendOTP, verifyOTP } = useAuth()

  const handleRegistration = async () => {
    setError('')
    setIsLoading(true)

    try {
      // Register the user normally - this will send a confirmation email
      const { data, error } = await signUp(
        formData.email.trim(),
        formData.password.trim(),
        {
          farm_name: formData.farmName,
          owner_name: formData.ownerName
        }
      )

      if (error) {
        setError((error as any).message || "Registration failed")
      } else if (data?.user) {
        const email = formData.email.trim()
        setVerificationEmail(email)
        setStep('verification')
        
        // Send OTP code immediately after registration
        const { error: otpError } = await sendOTP(email)
        if (otpError) {
          setError("Registration successful but failed to send verification code. Please try resending.")
        } else {
          setSuccess('Registration successful! Please check your email for the verification code.')
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }



  const handleResendCode = async () => {
    if (resendCooldown > 0) {
      setError(`Please wait ${resendCooldown} seconds before requesting another code.`)
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const { error } = await sendOTP(verificationEmail)
      
      if (error) {
        setError("Failed to resend verification code. Please try again.")
      } else {
        setSuccess('Verification code resent! Please check your inbox.')
        setResendCooldown(60)
        setCountdown(120) // Reset countdown
      }
    } catch (err) {
      setError("Failed to resend verification code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }



  const handleSkipVerification = () => {
    console.log('Skipping verification - going to dashboard')
    // Skip verification and go to dashboard
    onSuccess()
  }

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // 2-minute countdown timer
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  if (step === 'verification') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
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
              <p className="font-medium text-gray-900 mt-1">{verificationEmail}</p>
            </div>

            {/* Countdown Timer */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-orange-700 text-sm font-medium">
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
             </div>

                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
               <p className="text-blue-700 text-sm">
                 We've sent a verification code to your email. Enter the 6-digit code above to verify your account and access your dashboard.
               </p>
             </div>

                         {success && (
               <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                 <p className="text-green-600 text-sm">{success}</p>
               </div>
             )}

             {error && (
               <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                 <p className="text-red-600 text-sm">{error}</p>
               </div>
             )}
            
            

            <div className="space-y-3">
                             <Button 
                 onClick={async () => {
                   if (verificationCode.length === 6) {
                     setIsVerifyingCode(true)
                     setError("")
                     
                     try {
                       console.log('Verifying code:', verificationCode)
                       
                       // Use real OTP verification with Supabase
                       const { data, error } = await verifyOTP(verificationEmail, verificationCode)
                       
                       if (error) {
                         console.error('Verification failed:', error)
                         setError('Invalid verification code. Please try again.')
                         setVerificationCode("") // Clear the code
                       } else {
                         console.log('Code verified successfully!')
                         setSuccess('Email verified successfully!')
                         
                         // Wait a moment to show success message
                         await new Promise(resolve => setTimeout(resolve, 500))
                         
                         // Proceed to dashboard
                         onSuccess()
                       }
                     } catch (err) {
                       console.error('Verification failed:', err)
                       setError('Invalid verification code. Please try again.')
                       setVerificationCode("") // Clear the code
                     } finally {
                       setIsVerifyingCode(false)
                     }
                   }
                 }}
                disabled={verificationCode.length !== 6 || isVerifyingCode}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                 onClick={handleResendCode}
                 disabled={isLoading || resendCooldown > 0}
                 variant="outline"
                 className="w-full"
               >
                 {isLoading ? (
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
                onClick={() => {
                  console.log('Skip verification clicked')
                  handleSkipVerification()
                }}
                className="w-full"
              >
                Skip for Now - Go to Dashboard
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('Back to Sign Up clicked')
                  onBack()
                }}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold">Create Your Account</h1>
            <p className="text-gray-600 mt-1">Set up your farm management account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Farm Name
              </label>
              <Input
                type="text"
                placeholder="Enter your farm name"
                value={formData.farmName}
                onChange={(e) => setFormData(prev => ({ ...prev, farmName: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.ownerName}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <Button
              onClick={handleRegistration}
              disabled={isLoading || !formData.email || !formData.password || !formData.farmName || !formData.ownerName}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>

            <Button 
              variant="outline" 
              onClick={() => {
                console.log('Back to Sign In clicked - calling onBack()')
                onBack()
                console.log('onBack() called successfully')
              }}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
