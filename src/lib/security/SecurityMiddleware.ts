import { createError, ErrorType } from '@/lib/ErrorManager'

// Security headers and configurations
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
}

// Input sanitization
export class InputSanitizer {
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return ''
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000) // Limit length
  }

  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return ''
    
    const sanitized = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    return emailRegex.test(sanitized) ? sanitized : ''
  }

  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (typeof password !== 'string') {
      return { isValid: false, error: 'Password must be a string' }
    }

    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' }
    }

    if (password.length > 128) {
      return { isValid: false, error: 'Password is too long' }
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'admin', 'developer123']
    if (weakPasswords.includes(password.toLowerCase())) {
      return { isValid: false, error: 'Password is too weak' }
    }

    return { isValid: true }
  }
}

// Rate limiting for API calls
export class RateLimiter {
  private static attempts = new Map<string, { count: number; resetTime: number }>()
  private static readonly WINDOW_MS = 15 * 60 * 1000 // 15 minutes
  private static readonly MAX_ATTEMPTS = 100

  static checkLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const key = identifier.toLowerCase()
    
    let record = this.attempts.get(key)
    
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + this.WINDOW_MS }
      this.attempts.set(key, record)
    }

    record.count++
    
    const remaining = Math.max(0, this.MAX_ATTEMPTS - record.count)
    const allowed = record.count <= this.MAX_ATTEMPTS

    return { allowed, remaining, resetTime: record.resetTime }
  }

  static reset(identifier: string): void {
    this.attempts.delete(identifier.toLowerCase())
  }
}

// CSRF protection
export class CSRFProtection {
  private static readonly TOKEN_KEY = 'csrf_token'
  private static readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

  static generateToken(): string {
    const token = `csrf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiry = Date.now() + this.TOKEN_EXPIRY
    
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify({ token, expiry }))
    return token
  }

  static validateToken(token: string): boolean {
    try {
      const saved = localStorage.getItem(this.TOKEN_KEY)
      if (!saved) return false

      const { token: savedToken, expiry } = JSON.parse(saved)
      
      if (Date.now() > expiry) {
        localStorage.removeItem(this.TOKEN_KEY)
        return false
      }

      return token === savedToken
    } catch {
      return false
    }
  }

  static getToken(): string | null {
    try {
      const saved = localStorage.getItem(this.TOKEN_KEY)
      if (!saved) return null

      const { token, expiry } = JSON.parse(saved)
      
      if (Date.now() > expiry) {
        localStorage.removeItem(this.TOKEN_KEY)
        return null
      }

      return token
    } catch {
      return null
    }
  }
}

// Security audit logging
export class SecurityLogger {
  private static readonly LOG_KEY = 'security_log'
  private static readonly MAX_LOGS = 100

  static logEvent(event: {
    type: 'login_attempt' | 'login_success' | 'login_failure' | 'session_expired' | 'rate_limit_exceeded' | 'csrf_violation'
    email?: string
    ip?: string
    userAgent?: string
    details?: string
  }): void {
    try {
      const logs = this.getLogs()
      
      const logEntry = {
        ...event,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId()
      }

      logs.unshift(logEntry)
      
      // Keep only recent logs
      if (logs.length > this.MAX_LOGS) {
        logs.splice(this.MAX_LOGS)
      }

      localStorage.setItem(this.LOG_KEY, JSON.stringify(logs))
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  static getLogs(): any[] {
    try {
      const saved = localStorage.getItem(this.LOG_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }

  static clearLogs(): void {
    localStorage.removeItem(this.LOG_KEY)
  }

  private static getSessionId(): string {
    try {
      const session = localStorage.getItem('developerAuth')
      if (session) {
        const { sessionId } = JSON.parse(session)
        return sessionId || 'unknown'
      }
    } catch {}
    return 'unknown'
  }
}

// Security utilities
export const SecurityUtils = {
  // Generate secure random string
  generateSecureId(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // Hash string (simple implementation - use proper hashing in production)
  async hashString(input: string): Promise<string> {
    // In production, use a proper hashing library like bcrypt
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  },

  // Validate and sanitize user input
  sanitizeUserInput(input: any): any {
    if (typeof input === 'string') {
      return InputSanitizer.sanitizeString(input)
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeUserInput(item))
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeUserInput(value)
      }
      return sanitized
    }
    
    return input
  },

  // Check for suspicious patterns
  detectSuspiciousActivity(userAgent: string, ip: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /sqlmap/i,
      /nikto/i,
      /nmap/i
    ]

    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }
} 