'use client'

import { motion } from 'framer-motion'
import { EmailVerificationStatus } from '@/components/auth/EmailVerificationStatus'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, Shield, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EmailVerificationPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Email Verification
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Verify your email address to unlock all features
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Email Verification Status */}
            <EmailVerificationStatus 
              showActions={true}
              onVerificationChange={(isVerified) => {
                if (isVerified) {
                  // Show success message and redirect after a delay
                  setTimeout(() => {
                    router.push('/')
                  }, 2000)
                }
              }}
            />

            {/* Benefits of Email Verification */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Why Verify Your Email?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  Add buildings and staff members
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  Access all farm management features
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  Enhanced account security
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                  Password recovery options
                </li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
