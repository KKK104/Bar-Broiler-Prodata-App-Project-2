'use client'

import { motion } from 'framer-motion'
import { useEmailVerification } from '@/hooks/useEmailVerification'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface EmailVerificationIndicatorProps {
  showText?: boolean
  className?: string
}

export function EmailVerificationIndicator({ 
  showText = false, 
  className = "" 
}: EmailVerificationIndicatorProps) {
  const { isVerified, isLoading, error } = useEmailVerification()

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center space-x-1 ${className}`}
      >
        <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
        {showText && <span className="text-xs text-gray-500">Checking...</span>}
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center space-x-1 ${className}`}
      >
        <AlertCircle className="w-3 h-3 text-yellow-500" />
        {showText && <span className="text-xs text-yellow-600">Error</span>}
      </motion.div>
    )
  }

  if (isVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center space-x-1 ${className}`}
        title="Email verified"
      >
        <CheckCircle className="w-3 h-3 text-green-500" />
        {showText && <span className="text-xs text-green-600">Verified</span>}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center space-x-1 ${className}`}
      title="Email not verified"
    >
      <XCircle className="w-3 h-3 text-red-500" />
      {showText && <span className="text-xs text-red-600">Not Verified</span>}
    </motion.div>
  )
}
