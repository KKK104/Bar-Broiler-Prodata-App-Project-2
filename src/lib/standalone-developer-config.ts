// Standalone Developer Feedback Management Configuration
// This is separate from the main app authentication

export const DEVELOPER_ACCESS_CONFIG = {
  // Developer email (case-insensitive)
  EMAIL: process.env.NEXT_PUBLIC_DEVELOPER_EMAIL || "leonacinintal@gmail.com",
  
  // Simple password for demo purposes
  // In production, use environment variables and proper authentication
  PASSWORD: process.env.NEXT_PUBLIC_DEVELOPER_PASSWORD || "newdeveloper123",
  
  // Session storage key
  SESSION_KEY: "developerAuth",
  
  // Auto-logout after inactivity (in minutes)
  SESSION_TIMEOUT: 60,
  
  // Use simple client-side auth for development
  USE_SIMPLE_AUTH: true
}

// Check if user is authorized (simplified for development)
export function isAuthorizedDeveloper(email: string, password: string): boolean {
  if (DEVELOPER_ACCESS_CONFIG.USE_SIMPLE_AUTH) {
    // Simple client-side validation for development
    return email.toLowerCase() === DEVELOPER_ACCESS_CONFIG.EMAIL.toLowerCase() && 
           password === DEVELOPER_ACCESS_CONFIG.PASSWORD
  }
  
  // Original server-side validation
  return email.toLowerCase() === DEVELOPER_ACCESS_CONFIG.EMAIL.toLowerCase() && 
         password === DEVELOPER_ACCESS_CONFIG.PASSWORD
}

// Save authentication to localStorage
export function saveDeveloperAuth(email: string): void {
  const authData = {
    email: email.toLowerCase(),
    authenticated: true,
    timestamp: Date.now()
  }
  localStorage.setItem(DEVELOPER_ACCESS_CONFIG.SESSION_KEY, JSON.stringify(authData))
}

// Get saved authentication
export function getDeveloperAuth(): { email: string; authenticated: boolean; timestamp: number } | null {
  const saved = localStorage.getItem(DEVELOPER_ACCESS_CONFIG.SESSION_KEY)
  if (!saved) return null
  
  try {
    const authData = JSON.parse(saved)
    
    // Check if session has expired
    const now = Date.now()
    const sessionAge = now - authData.timestamp
    const sessionTimeoutMs = DEVELOPER_ACCESS_CONFIG.SESSION_TIMEOUT * 60 * 1000
    
    if (sessionAge > sessionTimeoutMs) {
      localStorage.removeItem(DEVELOPER_ACCESS_CONFIG.SESSION_KEY)
      return null
    }
    
    return authData
  } catch {
    localStorage.removeItem(DEVELOPER_ACCESS_CONFIG.SESSION_KEY)
    return null
  }
}

// Clear authentication
export function clearDeveloperAuth(): void {
  localStorage.removeItem(DEVELOPER_ACCESS_CONFIG.SESSION_KEY)
}

// Update session timestamp (extend session)
export function extendDeveloperSession(): void {
  const auth = getDeveloperAuth()
  if (auth) {
    saveDeveloperAuth(auth.email)
  }
} 