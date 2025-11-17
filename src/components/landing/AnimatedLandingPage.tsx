"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { 
  User, 
  Home, 
  Calculator, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building,
  Settings,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star,
  Award,
  Zap
} from "lucide-react"
import { ThemeToggle } from "../ui/theme-toggle"
import { CacheClearButton } from "../CacheClearButton"

interface AnimatedLandingPageProps {
  onSignUp: () => void
  onSignIn: () => void
  onParticipantLogin: () => void
  onGoToDashboard: () => void
  onSignOut: () => void
  user?: any
  authError?: string
  isNewUser?: boolean
}

export function AnimatedLandingPage({
  onSignUp,
  onSignIn,
  onParticipantLogin,
  onGoToDashboard,
  onSignOut,
  user,
  authError,
  isNewUser
}: AnimatedLandingPageProps) {
  const [showFeatures, setShowFeatures] = useState(false)

  const features = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Performance Analytics",
      description: "Track your farm's performance with detailed analytics and insights",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Building className="w-8 h-8" />,
      title: "Building Management",
      description: "Manage multiple buildings and track individual performance",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Staff Management",
      description: "Add and manage staff members with role-based access",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "Cost Tracking",
      description: "Monitor costs and calculate feed conversion ratios",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Harvest Analysis",
      description: "Analyze harvest data and optimize production",
      color: "from-red-500 to-red-600"
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "Smart Automation",
      description: "Automated calculations and performance benchmarks",
      color: "from-indigo-500 to-indigo-600"
    }
  ]

  const stats = [
    { label: "Active Farms", value: "✴", icon: <Home className="w-5 h-5" /> },
    { label: "Staff Members", value: "✴", icon: <Users className="w-5 h-5" /> },
    { label: "Buildings Tracked", value: "✴", icon: <Building className="w-5 h-5" /> },
    { label: "Data Points", value: "✴", icon: <BarChart3 className="w-5 h-5" /> }
  ] 

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Broiler Pro Data</span>
            </motion.div>

            {/* Theme Toggle and Developer Links */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <CacheClearButton />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16">
          <div className="text-center">
            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6"
              >
                Professional
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}Farm Management
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
              >
                note note note note,
                note.
              </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12"
            >
              {!user ? (
                <>
                  <Button
                    onClick={onSignUp}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start For Free 
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={onSignIn}
                    className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Owner Sign In
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={onParticipantLogin}
                    className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Staff Login
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={onGoToDashboard}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={onSignOut}
                    className="px-8 py-4 text-lg font-semibold rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    Sign Out
                  </Button>
                </>
              )}
            </motion.div>

            {/* Auth Error Display */}
            <AnimatePresence>
              {authError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-md mx-auto mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                >
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">{authError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mx-auto mb-3">
                    <div className="text-white">{stat.icon}</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 bg-white dark:bg-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive tools designed specifically for modern broiler farm management
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-white">{feature.icon}</div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 bg-gray-50 dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Farm Owners
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what our users have to say about their experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: "?",
                role: "Farm Owner",
                content: "This platform has revolutionized how we manage our farm. The analytics are incredible!",
                rating: 5
              },
              {
                name: "Sarah Johnson",
                role: "Operations Manager",
                content: "The staff management features make it so easy to coordinate our team. Highly recommended!",
                rating: 5
              },
              {
                name: "Michael Chen",
                role: "Farm Director",
                content: "The cost tracking and performance insights have helped us increase efficiency by 30%.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-20 bg-gradient-to-r from-blue-600 to-purple-600"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Farm?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              note note note note.
            </p>
            
            {!user ? (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={onSignUp}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
                
                <Button
                  variant="outline"
                  onClick={onSignIn}
                  className="border-white text-white hover:bg-white hover:text-blue-600 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-200"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Sign In
                </Button>
              </div>
            ) : (
              <Button
                onClick={onGoToDashboard}
                className="bg-white text-blue-600 hover:bg-gray-100 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Continue to Dashboard
              </Button>
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-12 bg-gray-900 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">Broiler Pro Data</span>
            </div>
            <p className="text-gray-400">
              Professional farm management system for modern agriculture
            </p>
            <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-400">
              <span>© 2025 Broiler Pro Data. All rights reserved.</span>
              <span>•</span>
              <span>Privacy Policy Working </span>
              <span>•</span>
              <span>Terms of Service working</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
