# Vercel Deployment Guide for Bar-Broiler-Prodata-App

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab Account**: Your code should be in a Git repository
3. **Supabase Project**: Ensure your Supabase project is set up and running

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Configure Environment Variables

Before deploying, you need to set up your Supabase environment variables in Vercel:

1. Go to your Vercel dashboard
2. Create a new project or select existing one
3. Go to Settings → Environment Variables
4. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option B: Using the provided script

```bash
# Run the deployment script
./deploy-vercel.bat
```

### Option C: Connect GitHub Repository

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables
6. Deploy

## Step 4: Configure Custom Domain (Optional)

1. In your Vercel dashboard, go to your project
2. Navigate to Settings → Domains
3. Add your custom domain
4. Configure DNS settings as instructed

## Environment Variables Setup

Make sure these environment variables are configured in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Common Issues:

1. **Build Failures**: Check the build logs in Vercel dashboard
2. **Environment Variables**: Ensure all required env vars are set
3. **Supabase Connection**: Verify your Supabase project is accessible
4. **Mobile App**: The mobile app (Capacitor) is separate from web deployment

### Build Optimization:

- The app is configured to ignore TypeScript and ESLint errors during build
- Images are set to unoptimized for better compatibility
- Package imports are optimized for better performance

## Post-Deployment

1. **Test the Application**: Visit your deployed URL and test all features
2. **Monitor Performance**: Use Vercel Analytics to monitor app performance
3. **Set up Monitoring**: Configure error tracking and performance monitoring

## Mobile App Deployment

Note: This deployment is for the web version. For mobile app deployment:

1. Build the mobile app: `npm run build:mobile`
2. Use Android Studio to build APK: `npm run android:build`
3. Or use the provided script: `./build-apk.bat`

## Support

If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test locally with `npm run dev`
4. Check Supabase connection 