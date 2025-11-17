"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent } from "../ui/card"
import { ChevronLeft, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface SignUpFormProps {
  onBack: () => void
  onSuccess: (userData: any) => void
  onEmailVerificationNeeded: (email: string) => void // New prop for email verification
}

export function SignUpForm({ onBack, onSuccess, onEmailVerificationNeeded }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    farmName: "",
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { signUp } = useAuth()

  // Update your signup form handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    const { email, password, confirmPassword } = formData

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (!email.includes('@')) {
      setError("Please enter a valid email address")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      console.log('Attempting signup with:', email)
      
      const { data, error } = await signUp(
        email.trim(),
        password.trim(),
        {
          farm_name: formData.farmName,
          owner_name: formData.ownerName
        }
      )

      if (error) {
        // Explicitly type error as any to access 'message'
        const typedError = error as { message?: string }
        console.error('Signup error:', typedError)
        
        let errorMessage = "An error occurred during signup"
        
        if (typedError.message) {
          errorMessage = typedError.message
        }
        
        // Handle specific error cases
        if (typedError.message?.includes('User already registered')) {
          errorMessage = "An account with this email already exists"
        } else if (typedError.message?.includes('Invalid email')) {
          errorMessage = "Please enter a valid email address"
        } else if (typedError.message?.includes('Password')) {
          errorMessage = "Password must be at least 6 characters"
        }
        
        setError(errorMessage)
      } else if (data?.user) {
        console.log('Signup successful:', data.user.email)
        
        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          // Email already confirmed, can proceed
          onSuccess(data.user)
        } else {
          // Email confirmation required
          onEmailVerificationNeeded(email)
        }
      }
    } catch (err) {
      console.error('Signup catch error:', err)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full">
            <ChevronLeft size={24} />
          </button>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Create Account</h1>
              <p className="text-gray-600 mt-1">Set up your farm management account</p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farm Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your farm name"
                  value={formData.farmName}
                  onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="text-center mt-4">
              <button 
                onClick={onBack}
                className="text-gray-600 text-sm hover:text-gray-800"
              >
                Already have an account? Sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}