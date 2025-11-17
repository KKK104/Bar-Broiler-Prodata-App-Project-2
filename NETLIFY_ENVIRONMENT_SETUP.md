# Netlify Environment Variables Setup Guide

## Problem
Your farm management app is showing "Failed to fetch" error because the required environment variables are not configured in your Netlify deployment.

## Solution

### 1. Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings > API
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 2. Configure Netlify Environment Variables

1. Go to your [Netlify Dashboard](https://app.netlify.com)
2. Select your site: `friendly-conkies-db6509`
3. Go to **Site settings** > **Environment variables**
4. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DEVELOPER_EMAIL=leonacinintal@gmail.com
DEVELOPER_PASSWORD_HASH=$2a$10$your-hashed-password-here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. Generate Password Hash

Run this command in your terminal to generate a password hash:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('leo123', 10));"
```

Replace `leo123` with your desired password.

### 4. Redeploy Your Site

After setting the environment variables:

1. Go to your Netlify dashboard
2. Click **Deploys**
3. Click **Trigger deploy** > **Deploy site**

### 5. Verify the Fix

1. Wait for the deployment to complete
2. Visit your site: https://friendly-conkies-db6509.netlify.app
3. Try logging in with your credentials
4. The "Failed to fetch" error should be resolved

## Alternative: Local Development Setup

If you want to test locally first, create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DEVELOPER_EMAIL=leonacinintal@gmail.com
DEVELOPER_PASSWORD_HASH=$2a$10$your-hashed-password-here
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

Then run:
```bash
npm run dev
```

## Troubleshooting

### If you still get "Failed to fetch":

1. **Check Supabase Project Status**: Ensure your Supabase project is active
2. **Verify API Keys**: Make sure you copied the correct anon key (not the service role key)
3. **Check CORS Settings**: In Supabase Dashboard > Settings > API, ensure your Netlify domain is allowed
4. **Review Netlify Function Logs**: Check the function logs in Netlify dashboard for any errors

### Common Issues:

- **Wrong Key**: Using service role key instead of anon key
- **CORS Issues**: Netlify domain not whitelisted in Supabase
- **Project URL**: Using wrong Supabase project URL
- **Environment Variables**: Variables not properly set in Netlify

## Security Notes

- Never commit `.env` files to your repository
- Use strong passwords for production
- Consider using Netlify's encrypted environment variables for sensitive data
- Regularly rotate your JWT secret
