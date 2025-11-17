#!/usr/bin/env node

/**
 * Script to help set up environment variables for Netlify deployment
 * Run this script to generate the required environment variables
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

console.log('🔧 Netlify Environment Variables Setup\n');

// Generate a secure JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('📋 Required Environment Variables for Netlify:\n');

console.log('DEVELOPER_EMAIL=your-email@example.com');
console.log('DEVELOPER_PASSWORD_HASH=<generated-hash>');
console.log(`JWT_SECRET=${jwtSecret}\n`);

console.log('🔐 To generate a password hash, run:');
console.log('node -e "const bcrypt = require(\'bcryptjs\'); console.log(bcrypt.hashSync(\'your-password\', 10));"\n');

console.log('📝 Instructions:');
console.log('1. Go to your Netlify dashboard');
console.log('2. Navigate to Site settings > Environment variables');
console.log('3. Add the above environment variables');
console.log('4. Replace "your-email@example.com" with your actual email');
console.log('5. Replace "your-password" with your desired password and generate the hash');
console.log('6. Deploy your site again\n');

console.log('⚠️  Security Notes:');
console.log('- Use a strong password');
console.log('- Keep your JWT_SECRET secure and unique');
console.log('- Consider using Netlify\'s encrypted environment variables for sensitive data'); 