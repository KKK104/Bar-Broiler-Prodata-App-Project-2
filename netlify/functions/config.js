// Netlify function to serve environment configuration
// This works on the free plan since functions can access environment variables

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Return configuration (you'll need to set these in Netlify function environment)
  const config = {
    supabaseUrl: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'placeholder-key',
    developerEmail: process.env.DEVELOPER_EMAIL || 'leonacinintal@gmail.com',
    developerPasswordHash: process.env.DEVELOPER_PASSWORD_HASH || '$2a$10$C3UQlhshVcHJm8TN9YbOfu0QLiExHEzXeL3OX6Qk7Z0rsafOiyQRq',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(config)
  };
};
