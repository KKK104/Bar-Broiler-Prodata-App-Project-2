"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Input } from "../ui/input"

import { Label } from "../ui/label"
import { 
  User, 
  Mail, 
  CheckCircle, 
  Home, 
  Users, 
  ArrowRight, 
  ArrowLeft,
  Building,
  Settings,
  Sparkles,
  Trophy
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { EmailVerificationStatus } from "../auth/EmailVerificationStatus"
import { useEmailVerification } from "@/hooks/useEmailVerification"

interface OnboardingStep {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  component: React.ReactNode
  isComplete: boolean
}

interface OnboardingFlowProps {
  onComplete: () => void
  onBack: () => void
  isFromSignIn?: boolean
}

interface FormData {
  farmName: string
  ownerName: string
  email: string
  password: string
  buildingCount: number
  buildingNames: string[]
  staffNames: string[]
  staffRoles: string[]
  staffCodes: string[]
}

export function OnboardingFlow({ onComplete, onBack, isFromSignIn = false }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    farmName: '',
    ownerName: '',
    email: '',
    password: '',
    buildingCount: 1,
    buildingNames: ['Building 1'],
    staffNames: [''],
    staffRoles: ['worker'],
    staffCodes: [`${Math.floor(Math.random() * 900000) + 100000}`]
  })
  const [emailVerified, setEmailVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signUp } = useAuth()

  // Check if user is already authenticated and has completed registration
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // User is authenticated, check if they need to continue onboarding
        if (currentStep === 0) {
          // Move to email verification step if user is already registered
          setCurrentStep(1)
        }
      }
    }
    
    checkAuthStatus()
  }, [currentStep])

  // Step Components - Declared before use
  const RegistrationStep = () => {
    const [userData, setUserData] = useState<any>(null)

    useEffect(() => {
      const getUserData = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserData(session.user)
          // Pre-fill form with user data
          setFormData(prev => ({
            ...prev,
            email: session.user.email || '',
            farmName: session.user.user_metadata?.farm_name || '',
            staffCodes: prev.staffCodes.length > 0 ? prev.staffCodes : [`${Math.floor(Math.random() * 900000) + 100000}`],
            ownerName: session.user.user_metadata?.owner_name || ''
          }))
        }
      }
      getUserData()
    }, [])

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        {userData ? (
          // User is already registered, show appropriate message based on source
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isFromSignIn ? 'Welcome Back!' : 'Account Created Successfully!'}
            </h3>
            <p className="text-gray-600">
              Welcome, <strong>{userData.user_metadata?.owner_name || userData.email}</strong>!
            </p>
            <p className="text-sm text-gray-500">
              {isFromSignIn 
                ? 'Let\'s continue setting up your farm.' 
                : 'Your account has been created. Please check your email for verification.'
              }
            </p>
            <Button
              onClick={() => setCurrentStep(1)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isFromSignIn ? 'Continue Setup' : 'Continue to Email Verification'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          // Show registration form
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Farm Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your farm name"
                  value={formData.farmName}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmName: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.ownerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}

            <Button
              onClick={handleRegistration}
              disabled={isLoading || !formData.email || !formData.password || !formData.farmName || !formData.ownerName}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </>
        )}
      </motion.div>
    )
  }

  const EmailVerificationStep = () => {
    const { isVerified } = useEmailVerification()

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Email Verification
            </h3>
            <p className="text-gray-600 mb-4">
              Verify your email address to unlock all features
            </p>
          </div>
        </div>
        
        {/* Email Verification Status Component */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <EmailVerificationStatus 
            showActions={true}
            onVerificationChange={(verified) => {
              if (verified) {
                // Auto-advance to next step when email is verified
                setTimeout(() => {
                  setCurrentStep(2)
                }, 1500)
              }
            }}
          />
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <Button
            onClick={() => {
              console.log('Skipping entire onboarding - going to dashboard')
              // Force skip onboarding and go to dashboard
              localStorage.setItem('skipOnboarding', 'true')
              localStorage.setItem('onboardingComplete', 'true')
              onComplete() // Go directly to dashboard
            }}
            variant="outline"
            className="w-full text-gray-600 hover:text-gray-800"
          >
            Skip for Now - Proceed to Dashboard
          </Button>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> You cannot add buildings and staff until you verify your email. 
              You can verify your email later from your account settings.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  const BuildingSetupStep = () => {
    const canProceed = formData.buildingNames.every(name => name.trim() !== '')

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="text-center mb-6">
          <p className="text-gray-600">
            Let's set up your farm buildings. You need at least one building to get started.
          </p>
        </div>

        <div className="space-y-4">
          {Array.from({ length: formData.buildingCount }, (_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-gray-200 rounded-lg space-y-4"
            >
              <h4 className="font-medium text-gray-900">Building {index + 1}</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building Number
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span>10 available</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span>7 in use</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Used: 1, 2, 3, 4, 5, 7, 9
                  </div>
                </div>
                <select
                  value={index + 1}
                  onChange={(e) => {
                    // Handle building number change if needed
                  }}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Building {i + 1}</option>
                  ))}
                </select>
                <div className="flex items-center mt-1 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span>Building {index + 1} is available</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Broiler House A"
                  value={formData.buildingNames[index]}
                  onChange={(e) => {
                    const newNames = [...formData.buildingNames]
                    newNames[index] = e.target.value
                    setFormData(prev => ({ ...prev, buildingNames: newNames }))
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  defaultValue="active"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cycle Number
                </label>
                <select
                  defaultValue="1"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cycle Start Date
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    defaultValue="2025-08-19"
                    className="w-full pr-10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="w-5 h-5 text-gray-400">
                      📅
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => {
                          setFormData(prev => ({
              ...prev,
              buildingCount: prev.buildingCount + 1,
              buildingNames: [...prev.buildingNames, `Building ${prev.buildingCount + 1}`]
            }))
            }}
            variant="outline"
            className="w-full"
          >
            <Building className="w-4 h-4 mr-2" />
            Add Another Building
          </Button>

          <Button
            onClick={() => setCurrentStep(3)}
            disabled={!canProceed}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue to Staff Setup
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    )
  }

  const StaffSetupStep = memo(() => {
    const canProceed = formData.staffNames.every(name => name.trim() !== '')

    const addNewStaffMember = () => {
      setFormData(prev => ({
        ...prev,
        staffNames: [...prev.staffNames, ''],
        staffRoles: [...prev.staffRoles, 'worker'],
        staffCodes: [...prev.staffCodes, `${Math.floor(Math.random() * 900000) + 100000}`]
      }))
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="text-center mb-6">
          <p className="text-gray-600">
            Add your team members who will help manage the farm. You need at least one staff member.
          </p>
        </div>
        
        <div className="space-y-4">
          {formData.staffNames.map((name, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg space-y-4"
            >
              <h4 className="font-medium text-gray-900">Staff Member {index + 1}</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant Name *
                </label>
                <Input
                  type="text"
                  placeholder="Enter staff member's full name"
                  value={name}
                  onChange={(e) => {
                    const newNames = [...formData.staffNames]
                    newNames[index] = e.target.value
                    setFormData(prev => ({ ...prev, staffNames: newNames }))
                  }}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access to tools
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'production_input', label: 'Production Input' },
                    { id: 'production_performance', label: 'Production Performance' },
                    { id: 'cost_management', label: 'Cost Management' },
                    { id: 'harvest_input', label: 'Harvest Input' },
                    { id: 'harvest_output', label: 'Harvest Output' }
                  ].map((tool) => (
                    <label key={tool.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        defaultChecked={tool.id === 'harvest_output'} // Default to Harvest Output checked
                      />
                      <span className="text-sm text-gray-700">{tool.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant Code
                </label>
                <Input
                  type="text"
                  value={formData.staffCodes[index]}
                  readOnly
                  className="w-full bg-gray-50"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          <Button
            onClick={addNewStaffMember}
            variant="outline"
            className="w-full"
          >
            <Users className="w-4 h-4 mr-2" />
            Add Another Staff Member
          </Button>

          <Button
            onClick={handleCompleteSetup}
            disabled={!canProceed || isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Setting up your farm...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Complete Setup</span>
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
          </Button>
        </div>
      </motion.div>
    )
  })

  const CompletionStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 text-center"
    >
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle className="w-10 h-10 text-green-600" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Welcome to Your Farm!
          </h3>
          <p className="text-gray-600 mb-6">
            Your farm is now set up with {formData.buildingCount} building{formData.buildingCount > 1 ? 's' : ''} and {formData.staffNames.length} staff member{formData.staffNames.length > 1 ? 's' : ''}. You're ready to start managing your operations!
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-50 rounded-lg p-4 space-y-2"
        >
          <h4 className="font-medium text-gray-900">What's Next?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Start tracking daily performance</li>
            <li>• Monitor your buildings</li>
            <li>• Manage your team</li>
            <li>• View performance analytics</li>
          </ul>
        </motion.div>

        <Button
          onClick={onComplete}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  )

  // Steps array - simplified flow: Registration → Email Verification → Building Setup → Staff Setup → Welcome
  const steps: OnboardingStep[] = [
    {
      id: "registration",
      title: "Create Your Account",
      subtitle: "Set up your farm management account",
      icon: <User className="w-6 h-6" />,
      component: <RegistrationStep />,
      isComplete: false
    },
    {
      id: "email-verification",
      title: "Verify Your Email",
      subtitle: "Verify your email or skip for now",
      icon: <Mail className="w-6 h-6" />,
      component: <EmailVerificationStep />,
      isComplete: emailVerified
    },
    {
      id: "buildings",
      title: "Add Your Buildings",
      subtitle: "Set up at least one building for your farm",
      icon: <Building className="w-6 h-6" />,
      component: <BuildingSetupStep />,
      isComplete: false
    },
    {
      id: "staff",
      title: "Add Your Team",
      subtitle: "Add at least one staff member to your farm",
      icon: <Users className="w-6 h-6" />,
      component: <StaffSetupStep />,
      isComplete: false
    },
    {
      id: "completion",
      title: "Welcome!",
      subtitle: "Your farm is ready to go",
      icon: <Trophy className="w-6 h-6" />,
      component: <CompletionStep />,
      isComplete: false
    }
  ]

  const handleResendEmail = async () => {
    setIsLoading(true)
    try {
      // In a real app, you'd resend the verification email
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert("Verification email resent!")
    } catch (error) {
      setError("Failed to resend email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailVerified = () => {
    // Mark email as verified and continue to building setup
    setEmailVerified(true)
    setCurrentStep(2) // Go to building setup
  }

  const handleRegistration = async () => {
    setError("")
    setIsLoading(true)

    try {
      // Note: In a real app, you'd check if email is already registered
      // For now, we'll let the signUp process handle duplicate email errors

      const { data, error } = await signUp(
        formData.email.trim(),
        formData.password.trim(),
        {
          farm_name: formData.farmName,
          owner_name: formData.ownerName
        }
      )

      if (error) {
        setError((error as any).message || "Registration failed")
      } else if (data?.user) {
        setCurrentStep(1) // Go to email verification
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteSetup = async () => {
    setIsLoading(true)
    
    try {
      // Here you would save all the setup data to your database
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setCurrentStep(4) // Go to completion
    } catch (error) {
      setError("Failed to complete setup. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                console.log('Skip Setup clicked - calling onComplete')
                onComplete()
              }}
              className="flex items-center text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              <span>Skip Setup</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </motion.button>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to Broiler Pro Data
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Let's get your farm set up in just a few steps
            </p>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    index <= currentStep
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </motion.div>
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className={`flex-1 h-1 mx-4 transition-colors ${
                      index < currentStep ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="max-w-2xl mx-auto relative">
            {/* Exit button in top-right corner */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => {
                console.log('X button clicked - calling onComplete')
                onComplete()
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
              title="Skip setup and go to dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
            
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  {steps[currentStep].icon}
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  {steps[currentStep].title}
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 dark:text-gray-300"
                >
                  {steps[currentStep].subtitle}
                </motion.p>
              </div>
              
              <AnimatePresence mode="wait">
                {steps[currentStep].component}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
