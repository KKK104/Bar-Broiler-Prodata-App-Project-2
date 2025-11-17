/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // Add optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts']
  },
  // Environment variables for static export
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yusqlnqtsszjjmyqaibp.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1c3FsbnF0c3N6ampteXFhaWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMzk5MjMsImV4cCI6MjA2NzYxNTkyM30.RTBBNk_SXYQBAMf9q0AfR5VkrGCw9IvAtLcLG1YtC88'
  }
}

module.exports = nextConfig