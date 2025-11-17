"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent } from "../ui/card"
import { ChevronLeft, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface SignInFormProps {
  onBack: () => void
  onSuccess: (isEmailVerified: boolean) => Promise<void>
}

export function SignInForm({ onBack, onSuccess }: SignInFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingVerification, setIsCheckingVerification] = useState(false)
  const [error, setError] = useState("")

  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      console.log("Attempting sign in with:", email)
      const { data, error, isEmailVerified } = await signIn(email, password)

      if (error) {
        console.error("Sign in error:", error)
        let errorMessage = "An error occurred during sign in"

        // Type guard to check if error has a message property
        const errorWithMessage = error as { message?: string }

        if (errorWithMessage.message) {
          errorMessage = errorWithMessage.message
        }

        // Handle specific error cases
        if (errorWithMessage.message?.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password"
        } else if (errorWithMessage.message?.includes("Email not confirmed")) {
          // Redirect to verification screen instead of showing error
          setError("")
          // Store the email for verification
          localStorage.setItem('pendingVerificationEmail', email)
          // Redirect to verification screen
          window.location.href = '/?view=email-verification'
          return
        }

        setError(errorMessage)
      } else if (data?.user) {
        console.log("Sign in successful:", data.user.email)
        console.log("Email verification status:", isEmailVerified)
        setIsCheckingVerification(true)
        await onSuccess(isEmailVerified)
      }
    } catch (err) {
      console.error("Sign in catch error:", err)
      
      // More specific error handling
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          setError("Network error. Please check your connection and try again.")
        } else if (err.message.includes('Failed to fetch')) {
          setError("Unable to connect to the server. Please check your internet connection.")
        } else {
          setError(`Error: ${err.message}`)
        }
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading screen for account identification
  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronLeft size={24} />
            </button>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                
                <h1 className="text-2xl font-bold dark:text-white mb-2">Identifying Account</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Checking your account status and setup progress...
                </p>
                
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-center space-x-3 text-sm">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600 dark:text-gray-400">Verifying email status</span>
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-sm">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600 dark:text-gray-400">Loading farm data</span>
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-sm">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600 dark:text-gray-400">Checking setup progress</span>
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-sm">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600 dark:text-gray-400">Preparing your dashboard</span>
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="flex items-center justify-center space-x-3 text-sm">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600 dark:text-gray-400">Finalizing setup</span>
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
                
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Loading your farm data...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold dark:text-white">Welcome Back</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Sign in to your farm account</p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                {error.includes("Please verify your email") && (
                  <Button
                    onClick={() => {
                      localStorage.setItem('pendingVerificationEmail', email)
                      window.location.href = '/?view=email-verification'
                    }}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Go to Email Verification
                  </Button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center mt-4">
              <button
                onClick={onBack}
                className="text-gray-600 dark:text-gray-400 text-sm hover:text-gray-800 dark:hover:text-gray-200"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}