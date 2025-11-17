import { createError, ErrorType } from '@/lib/ErrorManager'

// Security configuration
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour
  SESSION_KEY: 'developerAuth',
  LOGIN_ATTEMPTS_KEY: 'developerLoginAttempts'
}

interface LoginAttempts {
  count: number
  lastAttempt: number
  lockedUntil?: number
}

interface AuthSession {
  email: string
  authenticated: true
  timestamp: number
  sessionId: string
}

export class DeveloperAuthService {
  private static instance: DeveloperAuthService
  private loginAttempts: Map<string, LoginAttempts> = new Map()

  private constructor() {
    this.loadLoginAttempts()
  }

  static getInstance(): DeveloperAuthService {
    if (!DeveloperAuthService.instance) {
      DeveloperAuthService.instance = new DeveloperAuthService()
    }
    return DeveloperAuthService.instance
  }

  // Rate limiting and brute force protection
  private isAccountLocked(email: string): boolean {
    const attempts = this.loginAttempts.get(email.toLowerCase())
    if (!attempts) return false

    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      return true
    }

    // Reset if lockout period has passed
    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      this.resetLoginAttempts(email)
      return false
    }

    return false
  }

  private recordLoginAttempt(email: string, success: boolean): void {
    const key = email.toLowerCase()
    const attempts = this.loginAttempts.get(key) || { count: 0, lastAttempt: 0 }

    if (success) {
      this.resetLoginAttempts(email)
      return
    }

    attempts.count++
    attempts.lastAttempt = Date.now()

    // Lock account after max attempts
    if (attempts.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      attempts.lockedUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION
    }

    this.loginAttempts.set(key, attempts)
    this.saveLoginAttempts()
  }

  private resetLoginAttempts(email: string): void {
    this.loginAttempts.delete(email.toLowerCase())
    this.saveLoginAttempts()
  }

  private loadLoginAttempts(): void {
    try {
      const saved = localStorage.getItem(SECURITY_CONFIG.LOGIN_ATTEMPTS_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        this.loginAttempts = new Map(Object.entries(data))
      }
    } catch (error) {
      console.error('Error loading login attempts:', error)
    }
  }

  private saveLoginAttempts(): void {
    try {
      const data = Object.fromEntries(this.loginAttempts)
      localStorage.setItem(SECURITY_CONFIG.LOGIN_ATTEMPTS_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving login attempts:', error)
    }
  }

  // Secure authentication
  async authenticate(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Input validation
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' }
      }

      const normalizedEmail = email.toLowerCase().trim()

      // Check if account is locked
      if (this.isAccountLocked(normalizedEmail)) {
        const attempts = this.loginAttempts.get(normalizedEmail)
        const remainingTime = Math.ceil((attempts!.lockedUntil! - Date.now()) / 1000 / 60)
        return { 
          success: false, 
          error: `Account temporarily locked. Try again in ${remainingTime} minutes.` 
        }
      }

      // Validate credentials (in production, this should be server-side)
      const isValid = await this.validateCredentials(normalizedEmail, password)

      if (isValid) {
        this.recordLoginAttempt(normalizedEmail, true)
        this.createSession(normalizedEmail)
        return { success: true }
      } else {
        this.recordLoginAttempt(normalizedEmail, false)
        const attempts = this.loginAttempts.get(normalizedEmail)
        const remainingAttempts = SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - (attempts?.count || 0)
        
        return { 
          success: false, 
          error: `Invalid credentials. ${remainingAttempts} attempts remaining.` 
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return { success: false, error: 'Authentication failed. Please try again.' }
    }
  }

  // Validate credentials (should be server-side in production)
  private async validateCredentials(email: string, password: string): Promise<boolean> {
    // In production, this should make a server-side API call
    // For now, we'll use environment variables (still not ideal)
    const expectedEmail = process.env.NEXT_PUBLIC_DEVELOPER_EMAIL
    const expectedPassword = process.env.NEXT_PUBLIC_DEVELOPER_PASSWORD

    if (!expectedEmail || !expectedPassword) {
      console.warn('Developer credentials not configured')
      return false
    }

    // Simple comparison (in production, use proper hashing)
    return email === expectedEmail.toLowerCase() && password === expectedPassword
  }

  // Session management
  private createSession(email: string): void {
    const session: AuthSession = {
      email,
      authenticated: true,
      timestamp: Date.now(),
      sessionId: this.generateSessionId()
    }

    localStorage.setItem(SECURITY_CONFIG.SESSION_KEY, JSON.stringify(session))
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getSession(): AuthSession | null {
    try {
      const saved = localStorage.getItem(SECURITY_CONFIG.SESSION_KEY)
      if (!saved) return null

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
    localStorage.removeItem(SECURITY_CONFIG.SESSION_KEY)
  }

  extendSession(): void {
    const session = this.getSession()
    if (session) {
      session.timestamp = Date.now()
      localStorage.setItem(SECURITY_CONFIG.SESSION_KEY, JSON.stringify(session))
    }
  }

  // Security utilities
  isAuthenticated(): boolean {
    return this.getSession() !== null
  }

  getRemainingLockoutTime(email: string): number {
    const attempts = this.loginAttempts.get(email.toLowerCase())
    if (!attempts?.lockedUntil) return 0
    
    const remaining = attempts.lockedUntil - Date.now()
    return remaining > 0 ? Math.ceil(remaining / 1000 / 60) : 0
  }

  // Clean up expired data
  cleanup(): void {
    const now = Date.now()
    
    // Clean up expired login attempts
    for (const [email, attempts] of this.loginAttempts.entries()) {
      if (attempts.lockedUntil && now >= attempts.lockedUntil) {
        this.loginAttempts.delete(email)
      }
    }
    
    this.saveLoginAttempts()
  }
}

// Convenience functions
export const developerAuth = DeveloperAuthService.getInstance()

export const authenticateDeveloper = (email: string, password: string) => 
  developerAuth.authenticate(email, password)

export const isDeveloperAuthenticated = () => 
  developerAuth.isAuthenticated()

export const getDeveloperSession = () => 
  developerAuth.getSession()

export const clearDeveloperSession = () => 
  developerAuth.clearSession()

export const extendDeveloperSession = () => 
  developerAuth.extendSession() 