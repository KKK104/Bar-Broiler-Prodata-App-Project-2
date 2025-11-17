import { supabase } from './supabase'

/**
 * Sends an email with a verification code (OTP) using Supabase's signInWithOtp.
 * This creates a magic link that can be used for email verification.
 * For new users, we'll use this to verify the email before account creation.
 */
export async function sendVerificationEmail(email: string): Promise<boolean> {
  try {
    console.log('Attempting to send OTP to:', email)
    
    if (!email || email.trim() === '') {
      console.error('Email is empty or invalid:', email)
      return false
    }

    // Use signInWithOtp with shouldCreateUser: false to just send verification
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false, // Don't create user yet, just send OTP
        emailRedirectTo: `${window.location.origin}?verified=true`,
      },
    })

    // If user doesn't exist, we'll get an error, but that's okay for new registrations
    // We'll use this OTP flow anyway for email verification
    if (error && !error.message.includes('Signup requires a valid password')) {
      console.error("Supabase OTP send error:", error.message)
      return false
    }
    
    console.log(`Supabase OTP sent successfully to ${email}`)
    return true
  } catch (err) {
    console.error("Error sending verification email via Supabase OTP:", err)
    return false
  }
}

/**
 * Validates a verification code (OTP) using Supabase's verifyOtp.
 */
export async function validateVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: code,
      type: 'email', // Specify 'email' for email OTP verification
    })

    if (error) {
      console.error("Supabase OTP verification error:", error.message)
      return false
    }

    if (data.session && data.user) {
      console.log("Supabase OTP verified successfully:", data.user.email)
      return true
    } else {
      console.warn("Supabase OTP verification failed: No session or user data.")
      return false
    }
  } catch (err) {
    console.error("Error validating verification code via Supabase OTP:", err)
    return false
  }
}

/**
 * Alternative method to send OTP for existing users
 */
export async function resendVerificationCode(email: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
    })

    if (error) {
      console.error("Supabase OTP resend error:", error.message)
      return false
    }
    console.log(`Supabase OTP resent to ${email}`)
    return true
  } catch (err) {
    console.error("Error resending verification code via Supabase OTP:", err)
    return false
  }
}
