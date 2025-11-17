"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Settings, LogIn, Shield, AlertCircle } from "lucide-react"

interface FeedbackLoginFormProps {
  onLogin: (email: string, password: string) => void
  authError: string
}

export function FeedbackLoginForm({ onLogin, authError }: FeedbackLoginFormProps) {
  const [email, setEmail] = useState("leonacinintal@gmail.com")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({})

  const validateInputs = () => {
    const errors: { email?: string; password?: string } = {}

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      errors.email = "Please enter a valid email address"
    }

    // Simple password validation
    if (!password || password.length < 3) {
      errors.password = "Password is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateInputs()) {
      return
    }

    setIsLoading(true)
    setValidationErrors({})

    try {
      // Call the parent's login function
      onLogin(email.trim(), password)
    } catch (error) {
      console.error('Login error:', error)
      setValidationErrors({ password: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Settings className="w-8 h-8 text-blue-600" />
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Developer Access
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Secure authentication required
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {authError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-red-600 dark:text-red-400 text-sm">{authError}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="developer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className={validationErrors.email ? 'border-red-300' : ''}
              disabled={isLoading}
            />
            {validationErrors.email && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className={validationErrors.password ? 'border-red-300' : ''}
              disabled={isLoading}
            />
            {validationErrors.password && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.password}</p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading || !email || !password}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Authenticating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </div>
            )}
          </Button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Shield className="w-3 h-3" />
              <span>Secure server-side authentication</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 