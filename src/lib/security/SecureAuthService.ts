import { isAuthorizedDeveloper, saveDeveloperAuth, getDeveloperAuth, clearDeveloperAuth } from '@/lib/standalone-developer-config'

// Security configuration
const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour
  SESSION_KEY: 'developerAuth',
  TOKEN_KEY: 'developerToken'
}

interface AuthSession {
  email: string
  role: string
  authenticated: true
  timestamp: number
  sessionId: string
}

interface LoginResponse {
  success: boolean
  error?: string
  token?: string
  user?: {
    email: string
    role: string
  }
}

// Simple security logger that doesn't depend on complex imports
const SecurityLogger = {
  logEvent: (event: any) => {
    if (typeof window !== 'undefined') {
      console.log('Security Event:', event)
    }
  }
}

export class SecureAuthService {
  private static instance: SecureAuthService

  private constructor() {}

  static getInstance(): SecureAuthService {
    if (!SecureAuthService.instance) {
      SecureAuthService.instance = new SecureAuthService()
    }
    return SecureAuthService.instance
  }

  // Check if we're in browser environment
  private isBrowser(): boolean {
    return typeof window !== 'undefined'
  }

  // Secure authentication using server-side API
  async authenticate(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Input validation
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' }
      }

      const normalizedEmail = email.toLowerCase().trim()

      // Log login attempt
      if (this.isBrowser()) {
        SecurityLogger.logEvent({
          type: 'login_attempt',
          email: normalizedEmail,
          userAgent: navigator.userAgent
        })
      }

      // Try simple client-side authentication first (for development)
      if (isAuthorizedDeveloper(normalizedEmail, password)) {
        // Create session using simple auth
        if (this.isBrowser()) {
          saveDeveloperAuth(normalizedEmail)
        }
        
        // Log successful login
        if (this.isBrowser()) {
          SecurityLogger.logEvent({
            type: 'login_success',
            email: normalizedEmail,
            userAgent: navigator.userAgent
          })
        }

        return { success: true }
      }

      // Fallback to server-side authentication
      if (this.isBrowser()) {
        try {
          const response = await fetch('/.netlify/functions/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: normalizedEmail,
              password: password
            })
          })

          const data: LoginResponse = await response.json()

          if (data.success && data.token && data.user) {
            // Store JWT token securely
            this.storeToken(data.token)
            
            // Create session
            this.createSession(data.user.email, data.user.role)

            // Log successful login
            SecurityLogger.logEvent({
              type: 'login_success',
              email: normalizedEmail,
              userAgent: navigator.userAgent
            })

            return { success: true }
          } else {
            // Log failed login
            SecurityLogger.logEvent({
              type: 'login_failure',
              email: normalizedEmail,
              userAgent: navigator.userAgent,
              details: data.error
            })

            return { success: false, error: data.error || 'Authentication failed' }
          }
        } catch (serverError) {
          console.error('Server authentication failed, using client-side fallback:', serverError)
          
          // If server auth fails, try client-side auth as fallback
          if (isAuthorizedDeveloper(normalizedEmail, password)) {
            saveDeveloperAuth(normalizedEmail)
            return { success: true }
          }
          
          return { success: false, error: 'Authentication failed' }
        }
      }

      return { success: false, error: 'Authentication failed' }

    } catch (error) {
      console.error('Authentication error:', error)
      
      if (this.isBrowser()) {
        SecurityLogger.logEvent({
          type: 'login_failure',
          email: email,
          userAgent: navigator.userAgent,
          details: 'Network error'
        })
      }

      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  // Verify authentication with server
  async verifyAuth(): Promise<{ valid: boolean; user?: any }> {
    try {
      if (!this.isBrowser()) {
        return { valid: false }
      }

      const token = this.getToken()
      
      if (!token) {
        // Try simple auth as fallback
        const simpleAuth = getDeveloperAuth()
        if (simpleAuth) {
          return { 
            valid: true, 
            user: { 
              email: simpleAuth.email, 
              role: 'developer' 
            } 
          }
        }
        return { valid: false }
      }

      // Verify token with Netlify function
      const response = await fetch('/.netlify/functions/auth', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success && data.user) {
        return { valid: true, user: data.user }
      } else {
        // Token is invalid, clear session
        this.clearSession()
        return { valid: false }
      }

    } catch (error) {
      console.error('Token verification error:', error)
      this.clearSession()
      return { valid: false }
    }
  }

  // Session management
  private createSession(email: string, role: string): void {
    if (!this.isBrowser()) return

    const session: AuthSession = {
      email,
      role,
      authenticated: true,
      timestamp: Date.now(),
      sessionId: this.generateSessionId()
    }

    localStorage.setItem(SECURITY_CONFIG.SESSION_KEY, JSON.stringify(session))
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get session using simple auth as fallback
  getSession(): AuthSession | null {
    if (!this.isBrowser()) return null

    try {
      const saved = localStorage.getItem(SECURITY_CONFIG.SESSION_KEY)
      if (!saved) {
        // Try simple auth session as fallback
        const simpleAuth = getDeveloperAuth()
        if (simpleAuth) {
          return {
            email: simpleAuth.email,
            role: 'developer',
            authenticated: true,
            timestamp: simpleAuth.timestamp,
            sessionId: 'simple-auth-session'
          }
        }
        return null
      }

      const session: AuthSession = JSON.parse(saved)
      
      // Check if session has expired
      if (Date.now() - session.timestamp > SECURITY_CONFIG.SESSION_TIMEOUT) {
        this.clearSession()
        return null
      }

      return session
    } catch (error) {
      console.error('Error parsing session:', error)
      this.clearSession()
      return null
    }
  }

  clearSession(): void {
    if (!this.isBrowser()) return

    localStorage.removeItem(SECURITY_CONFIG.SESSION_KEY)
    localStorage.removeItem(SECURITY_CONFIG.TOKEN_KEY)
    clearDeveloperAuth() // Also clear simple auth
  }

  extendSession(): void {
    if (!this.isBrowser()) return

    const session = this.getSession()
    if (session) {
      session.timestamp = Date.now()
      localStorage.setItem(SECURITY_CONFIG.SESSION_KEY, JSON.stringify(session))
    }
  }

  // Token management
  private storeToken(token: string): void {
    if (!this.isBrowser()) return
    localStorage.setItem(SECURITY_CONFIG.TOKEN_KEY, token)
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null
    return localStorage.getItem(SECURITY_CONFIG.TOKEN_KEY)
  }

  // Security utilities
  isAuthenticated(): boolean {
    const session = this.getSession()
    return session !== null
  }

  // Logout
  async logout(): Promise<void> {
    if (!this.isBrowser()) return

    const session = this.getSession()
    
    if (session) {
      SecurityLogger.logEvent({
        type: 'session_expired',
        email: session.email,
        userAgent: navigator.userAgent,
        details: 'User logged out'
      })
    }

    this.clearSession()
  }

  // Get current user
  getCurrentUser(): { email: string; role: string } | null {
    const session = this.getSession()
    if (!session) return null

    return {
      email: session.email,
      role: session.role
    }
  }

  // Refresh token (if needed)
  async refreshToken(): Promise<boolean> {
    try {
      const { valid } = await this.verifyAuth()
      
      if (valid) {
        this.extendSession()
        return true
      } else {
        this.clearSession()
        return false
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      this.clearSession()
      return false
    }
  }
}

// Convenience functions
export const secureAuth = SecureAuthService.getInstance()

export const authenticateDeveloper = (email: string, password: string) => 
  secureAuth.authenticate(email, password)

export const isDeveloperAuthenticated = () => 
  secureAuth.isAuthenticated()

export const getDeveloperSession = () => 
  secureAuth.getSession()

export const clearDeveloperSession = () => 
  secureAuth.clearSession()

export const extendDeveloperSession = () => 
  secureAuth.extendSession()

export const logoutDeveloper = () => 
  secureAuth.logout()

export const getCurrentDeveloper = () => 
  secureAuth.getCurrentUser()

export const verifyDeveloperAuth = () => 
  secureAuth.verifyAuth() 