"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent } from "./ui/card"
import { User, Lock } from "lucide-react"

interface ParticipantLoginProps {
  onLogin: (code: string) => void
  onBack: () => void
}

export function ParticipantLogin({ onLogin, onBack }: ParticipantLoginProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      alert("Please enter your access code")
      return
    }

    setIsLoading(true)
    
    try {
      await onLogin(code)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 border-b">
          <div className="text-center text-xl font-semibold">
            <User className="w-8 h-8 mx-auto mb-2" />
            Staff Login
          </div>
        </div>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Code
              </label>
              <Input
                type="password"
                placeholder="Enter your access code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                className="text-center text-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the code provided by your administrator
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBack}
            >
              Back to Home
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}