"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { AlertTriangle, CheckCircle, RefreshCw, User, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function AuthDebugger() {
  const [authState, setAuthState] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAuthState = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        setError(`Session error: ${sessionError.message}`)
      }

      setSession(session)

      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('User error:', userError)
        setError(`User error: ${userError.message}`)
      }

      setUser(user)

      // Test database connection
      const { data: testData, error: dbError } = await supabase
        .from('farms')
        .select('id, name')
        .limit(1)

      setAuthState({
        hasSession: !!session,
        hasUser: !!user,
        canAccessDatabase: !dbError,
        sessionExpiry: session?.expires_at,
        userEmail: user?.email,
        userId: user?.id,
        dbError: dbError?.message,
        testData
      })

      console.log('🔍 Auth Debug Info:', {
        session,
        user,
        dbError,
        testData
      })

    } catch (error) {
      console.error('Auth check error:', error)
      setError(`Auth check failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Refresh error:', error)
        setError(`Refresh failed: ${error.message}`)
      } else {
        console.log('✅ Session refreshed successfully')
        await checkAuthState()
      }
    } catch (error) {
      console.error('Refresh session error:', error)
      setError(`Refresh failed: ${error.message}`)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
      } else {
        console.log('✅ Signed out successfully')
        await checkAuthState()
      }
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  useEffect(() => {
    checkAuthState()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session)
        await checkAuthState()
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Checking authentication state...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Authentication Debugger</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Auth State Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center space-x-2">
            {authState?.hasSession ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">Session</span>
          </div>

          <div className="flex items-center space-x-2">
            {authState?.hasUser ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">User</span>
          </div>

          <div className="flex items-center space-x-2">
            {authState?.canAccessDatabase ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">Database</span>
          </div>

          <Badge variant={authState?.hasSession ? "default" : "destructive"}>
            {authState?.hasSession ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>

        {/* Detailed Information */}
        <div className="space-y-2 text-sm">
          {authState?.userEmail && (
            <div className="flex items-center space-x-2">
              <User className="h-3 w-3" />
              <span>Email: {authState.userEmail}</span>
            </div>
          )}
          
          {authState?.userId && (
            <div className="flex items-center space-x-2">
              <User className="h-3 w-3" />
              <span>User ID: {authState.userId.substring(0, 8)}...</span>
            </div>
          )}

          {authState?.sessionExpiry && (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-3 w-3" />
              <span>Session expires: {new Date(authState.sessionExpiry * 1000).toLocaleString()}</span>
            </div>
          )}

          {authState?.dbError && (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <span className="text-red-600">DB Error: {authState.dbError}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button 
            onClick={checkAuthState}
            size="sm"
            variant="outline"
            className="flex items-center space-x-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh Check</span>
          </Button>

          {authState?.hasSession && (
            <Button 
              onClick={refreshSession}
              size="sm"
              variant="outline"
              className="flex items-center space-x-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh Session</span>
            </Button>
          )}

          {authState?.hasSession && (
            <Button 
              onClick={signOut}
              size="sm"
              variant="outline"
              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
            >
              <User className="h-3 w-3" />
              <span>Sign Out</span>
            </Button>
          )}
        </div>

        {/* Raw Data (for debugging) */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium">Show Raw Data</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({ session, user, authState }, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  )
}

