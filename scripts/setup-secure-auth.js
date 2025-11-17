#!/usr/bin/env node

const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

console.log('🔐 Setting up secure authentication...\n')

// Generate secure credentials
async function generateSecureCredentials() {
  const email = process.argv[2] || 'admin@example.com'
  const password = process.argv[3] || generateSecurePassword()
  
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Password: ${password}`)
  console.log('')

  // Hash password with bcrypt
  const saltRounds = 12
  const hashedPassword = await bcrypt.hash(password, saltRounds)
  
  // Generate JWT secret
  const jwtSecret = crypto.randomBytes(64).toString('hex')
  
  // Generate environment variables
  const envContent = `# Secure Authentication Configuration
# Generated on ${new Date().toISOString()}

# Developer credentials (server-side only)
DEVELOPER_EMAIL=${email}
DEVELOPER_PASSWORD_HASH=${hashedPassword}

# JWT Secret (change in production)
JWT_SECRET=${jwtSecret}

# Security settings
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# Remove any NEXT_PUBLIC_ prefixes from sensitive data
# The following variables are NOT exposed to the client:
# - DEVELOPER_EMAIL
# - DEVELOPER_PASSWORD_HASH  
# - JWT_SECRET
`

  // Write to .env.local
  const envPath = path.join(process.cwd(), '.env.local')
  fs.writeFileSync(envPath, envContent)
  
  console.log('✅ Environment variables written to .env.local')
  console.log('')
  console.log('🔒 Security Notes:')
  console.log('  - Credentials are now server-side only')
  console.log('  - Password is hashed with bcrypt')
  console.log('  - JWT secret is cryptographically secure')
  console.log('  - No sensitive data exposed to client')
  console.log('')
  console.log('📝 Next Steps:')
  console.log('  1. Add .env.local to .gitignore')
  console.log('  2. Install dependencies: npm install bcryptjs jsonwebtoken')
  console.log('  3. Update your deployment environment variables')
  console.log('  4. Test the new authentication system')
  console.log('')
  console.log('⚠️  IMPORTANT: Keep these credentials secure!')
  console.log(`   Email: ${email}`)
  console.log(`   Password: ${password}`)
  console.log('')
  
  return { email, password, hashedPassword, jwtSecret }
}

function generateSecurePassword() {
  const length = 16
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  return password
}

// Update package.json with new dependencies
function updatePackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json')
  
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    
    // Add security dependencies
    if (!packageJson.dependencies) packageJson.dependencies = {}
    if (!packageJson.dependencies.bcryptjs) {
      packageJson.dependencies.bcryptjs = '^2.4.3'
    }
    if (!packageJson.dependencies.jsonwebtoken) {
      packageJson.dependencies.jsonwebtoken = '^9.0.2'
    }
    
    // Add types for TypeScript
    if (!packageJson.devDependencies) packageJson.devDependencies = {}
    if (!packageJson.devDependencies['@types/bcryptjs']) {
      packageJson.devDependencies['@types/bcryptjs'] = '^2.4.6'
    }
    if (!packageJson.devDependencies['@types/jsonwebtoken']) {
      packageJson.devDependencies['@types/jsonwebtoken'] = '^9.0.5'
    }
    
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))
    console.log('✅ Package.json updated with security dependencies')
  }
}

// Create .gitignore entry
function updateGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore')
  const gitignoreContent = '\n# Environment variables\n.env.local\n.env.production.local\n.env.development.local\n'
  
  if (fs.existsSync(gitignorePath)) {
    const currentContent = fs.readFileSync(gitignorePath, 'utf8')
    if (!currentContent.includes('.env.local')) {
      fs.appendFileSync(gitignorePath, gitignoreContent)
      console.log('✅ .gitignore updated to exclude environment files')
    }
  } else {
    fs.writeFileSync(gitignorePath, gitignoreContent)
    console.log('✅ .gitignore created')
  }
}

// Main execution
async function main() {
  try {
    await generateSecureCredentials()
    updatePackageJson()
    updateGitignore()
    
    console.log('🎉 Secure authentication setup complete!')
    console.log('')
    console.log('Run the following commands to install dependencies:')
    console.log('  npm install')
    console.log('')
    console.log('Then test the authentication:')
    console.log('  npm run dev')
    console.log('  # Navigate to /developer-feedback')
    
  } catch (error) {
    console.error('❌ Error setting up secure authentication:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { generateSecureCredentials, updatePackageJson, updateGitignore } 