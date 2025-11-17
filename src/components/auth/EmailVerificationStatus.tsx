'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { useEmailVerification } from '@/hooks/useEmailVerification'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Mail, 
  RefreshCw,
  Clock
} from 'lucide-react'

interface EmailVerificationStatusProps {
  showActions?: boolean
  compact?: boolean
  onVerificationChange?: (isVerified: boolean) => void
}

export function EmailVerificationStatus({ 
  showActions = true, 
  compact = false,
  onVerificationChange 
}: EmailVerificationStatusProps) {
  const { 
    isVerified, 
    email, 
    isLoading, 
    error, 
    lastChecked,
    checkEmailVerification,
    resendVerificationEmail 
  } = useEmailVerification()

  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  // Notify parent component when verification status changes
  if (onVerificationChange && !isLoading) {
    onVerificationChange(isVerified)
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendMessage(null)
    
    const result = await resendVerificationEmail()
    
    if (result.success) {
      setResendMessage('Verification email sent! Check your inbox.')
    } else {
      setResendMessage(`Error: ${result.message}`)
    }
    
    setIsResending(false)
    
    // Clear message after 5 seconds
    setTimeout(() => setResendMessage(null), 5000)
  }

  const handleRefreshStatus = async () => {
    await checkEmailVerification()
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center space-x-2 ${compact ? 'text-sm' : 'text-base'}`}
      >
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
        <span className="text-gray-600">Checking email verification...</span>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center space-x-2 ${compact ? 'text-sm' : 'text-base'}`}
      >
        <XCircle className="w-4 h-4 text-red-500" />
        <span className="text-red-600">Error: {error}</span>
        {showActions && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStatus}
            className="ml-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </motion.div>
    )
  }

  if (!email) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center space-x-2 ${compact ? 'text-sm' : 'text-base'}`}
      >
        <AlertCircle className="w-4 h-4 text-yellow-500" />
        <span className="text-yellow-600">No email address found</span>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* Status Display */}
      <div className={`flex items-center space-x-2 ${compact ? 'text-sm' : 'text-base'}`}>
        {isVerified ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-600 font-medium">Email Verified</span>
            <span className="text-gray-500">({email})</span>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-600 font-medium">Email Not Verified</span>
            <span className="text-gray-500">({email})</span>
          </>
        )}
      </div>

      {/* Last Checked Time */}
      {lastChecked && (
        <div className={`flex items-center space-x-1 ${compact ? 'text-xs' : 'text-sm'} text-gray-500`}>
          <Clock className="w-3 h-3" />
          <span>Last checked: {lastChecked.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Actions */}
      {showActions && !isVerified && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            {isResending ? (
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Mail className="w-3 h-3 mr-1" />
            )}
            {isResending ? 'Sending...' : 'Resend Verification Email'}
          </Button>
          
          <Button
            onClick={handleRefreshStatus}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh Status
          </Button>
        </motion.div>
      )}

      {/* Resend Message */}
      <AnimatePresence>
        {resendMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-2 rounded-md text-sm ${
              resendMessage.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {resendMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Info */}
      {!isVerified && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`bg-blue-50 border border-blue-200 rounded-md p-3 ${compact ? 'text-xs' : 'text-sm'}`}
        >
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-800 font-medium mb-1">Email Verification Required</p>
              <p className="text-blue-700">
                You need to verify your email address to access all features. 
                Check your inbox for the verification link or request a new one.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
