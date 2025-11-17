const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Server-side environment variables
const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL
const DEVELOPER_PASSWORD_HASH = process.env.DEVELOPER_PASSWORD_HASH
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

// Rate limiting storage (in production, use Redis)
const loginAttempts = new Map()
const MAX_ATTEMPTS = 10 // Increased for development
const LOCKOUT_DURATION = 5 * 60 * 1000 // Reduced to 5 minutes for development

// Rate limiting function
function checkRateLimit(identifier) {
  const now = Date.now()
  const key = identifier.toLowerCase()
  
  let record = loginAttempts.get(key)
  
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + LOCKOUT_DURATION }
    loginAttempts.set(key, record)
  }

  record.count++
  
  const remaining = Math.max(0, MAX_ATTEMPTS - record.count)
  const allowed = record.count <= MAX_ATTEMPTS

  return { allowed, remaining }
}

// Reset rate limit on successful login
function resetRateLimit(identifier) {
  loginAttempts.delete(identifier.toLowerCase())
}

// Validate credentials
async function validateCredentials(email, password) {
  if (!DEVELOPER_EMAIL || !DEVELOPER_PASSWORD_HASH) {
    console.error('Developer credentials not configured')
    return false
  }

  // Check email
  if (email.toLowerCase() !== DEVELOPER_EMAIL.toLowerCase()) {
    return false
  }

  // Verify password hash
  try {
    return await bcrypt.compare(password, DEVELOPER_PASSWORD_HASH)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

// Generate JWT token
function generateToken(email) {
  const payload = {
    email: email.toLowerCase(),
    role: 'developer',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  }

  return jwt.sign(payload, JWT_SECRET)
}

// Verify JWT token
function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return { valid: true, payload }
  } catch (error) {
    return { valid: false }
  }
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    if (event.httpMethod === 'POST') {
      // Handle login
      const body = JSON.parse(event.body)
      const { email, password } = body

      // Input validation
      if (!email || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Email and password are required'
          })
        }
      }

      const normalizedEmail = email.toLowerCase().trim()

      // Check rate limiting
      const rateLimit = checkRateLimit(normalizedEmail)
      if (!rateLimit.allowed) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({
            success: false,
            error: `Too many login attempts. Try again in ${Math.ceil((rateLimit.remaining * 60 * 1000) / 1000 / 60)} minutes.`
          })
        }
      }

      // Validate credentials
      const isValid = await validateCredentials(normalizedEmail, password)

      if (isValid) {
        // Reset rate limit on success
        resetRateLimit(normalizedEmail)

        // Generate JWT token
        const token = generateToken(normalizedEmail)

        // Log successful login
        console.log(`Successful login: ${normalizedEmail} at ${new Date().toISOString()}`)

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            token,
            user: {
              email: normalizedEmail,
              role: 'developer'
            }
          })
        }
      } else {
        // Log failed login attempt
        console.log(`Failed login attempt: ${normalizedEmail} at ${new Date().toISOString()}`)

        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: `Invalid credentials. ${rateLimit.remaining} attempts remaining.`
          })
        }
      }

    } else if (event.httpMethod === 'GET') {
      // Check if this is a rate limit reset request
      if (event.queryStringParameters && event.queryStringParameters.reset === 'true') {
        // Clear all rate limiting (for development purposes)
        loginAttempts.clear()
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Rate limiting cleared'
          })
        }
      }
      
      // Handle token verification
      const authHeader = event.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'No token provided'
          })
        }
      }

      const token = authHeader.substring(7)
      const { valid, payload } = verifyToken(token)

      if (!valid) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid or expired token'
          })
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          user: {
            email: payload.email,
            role: payload.role
          }
        })
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed'
      })
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    }
  }
} 