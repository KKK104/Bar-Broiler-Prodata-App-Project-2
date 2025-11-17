"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent } from "../ui/card"
import { 
  Building, 
  Plus, 
  Minus, 
  Home, 
  Settings, 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface AnimatedBuildingSetupProps {
  onComplete: () => void
  onBack: () => void
  userId?: string
  farmId?: string
}

export function AnimatedBuildingSetup({ onComplete, onBack, userId, farmId }: AnimatedBuildingSetupProps) {
  const [buildingCount, setBuildingCount] = useState(1)
  const [buildingNames, setBuildingNames] = useState<string[]>(["Building 1"])
  const [buildingTypes, setBuildingTypes] = useState<string[]>(["broiler"])
  const [buildingCapacities, setBuildingCapacities] = useState<number[]>([10000])
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const buildingTypeOptions = [
    { value: "broiler", label: "Broiler House", icon: "🐔", description: "For meat production" },
    { value: "layer", label: "Layer House", icon: "🥚", description: "For egg production" },
    { value: "breeder", label: "Breeder House", icon: "👨‍👩‍👧‍👦", description: "For breeding stock" },
    { value: "nursery", label: "Nursery", icon: "🐤", description: "For young birds" }
  ]

  const capacityOptions = [
    { value: 5000, label: "5,000 birds", description: "Small operation" },
    { value: 10000, label: "10,000 birds", description: "Medium operation" },
    { value: 15000, label: "15,000 birds", description: "Large operation" },
    { value: 20000, label: "20,000 birds", description: "Commercial scale" },
    { value: 25000, label: "25,000 birds", description: "Industrial scale" }
  ]

  const handleCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 10) return
    
    setBuildingCount(newCount)
    
    const newNames = Array.from({ length: newCount }, (_, i) => 
      buildingNames[i] || `Building ${i + 1}`
    )
    const newTypes = Array.from({ length: newCount }, (_, i) => 
      buildingTypes[i] || "broiler"
    )
    const newCapacities = Array.from({ length: newCount }, (_, i) => 
      buildingCapacities[i] || 10000
    )
    
    setBuildingNames(newNames)
    setBuildingTypes(newTypes)
    setBuildingCapacities(newCapacities)
  }

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...buildingNames]
    newNames[index] = name
    setBuildingNames(newNames)
  }

  const handleTypeChange = (index: number, type: string) => {
    const newTypes = [...buildingTypes]
    newTypes[index] = type
    setBuildingTypes(newTypes)
  }

  const handleCapacityChange = (index: number, capacity: number) => {
    const newCapacities = [...buildingCapacities]
    newCapacities[index] = capacity
    setBuildingCapacities(newCapacities)
  }

  const handleSubmit = async () => {
    if (!userId || !farmId) return

    setIsLoading(true)

    try {
      // Create buildings
      const buildingsToInsert = buildingNames.map((name, index) => ({
        name: name.trim() || 'Unnamed Building',
        farm_id: farmId,
        type: buildingTypes[index],
        capacity: buildingCapacities[index],
        status: 'active',
        cycle_number: 1,
        cycle_start_date: new Date().toISOString().split('T')[0]
      }))

      const { error: buildingsError } = await supabase
        .from('buildings')
        .insert(buildingsToInsert)

      if (buildingsError) throw buildingsError

      onComplete()
    } catch (error) {
      console.error('Error setting up buildings:', error)
      alert('Error setting up buildings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    {
      title: "Number of Buildings",
      description: "How many buildings does your farm have?",
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Building className="w-10 h-10 text-blue-600" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              How many buildings?
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Select the number of buildings on your farm
            </p>
          </div>

          <div className="flex items-center justify-center space-x-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleCountChange(buildingCount - 1)}
              disabled={buildingCount <= 1}
              className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Minus className="w-6 h-6" />
            </motion.button>
            
            <motion.div
              key={buildingCount}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold text-blue-600 w-24 text-center"
            >
              {buildingCount}
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleCountChange(buildingCount + 1)}
              disabled={buildingCount >= 10}
              className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {buildingCount === 1 ? "1 building" : `${buildingCount} buildings`}
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Building Details",
      description: "Configure each building's specifications",
      component: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Building Configuration
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Set up each building with its specific details
            </p>
          </div>

          <div className="space-y-6">
            {buildingNames.map((name, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6"
              >
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Building {index + 1}
                  </h4>
                </div>

                <div className="space-y-4">
                  {/* Building Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Building Name
                    </label>
                    <Input
                      type="text"
                      placeholder={`Building ${index + 1}`}
                      value={name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Building Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Building Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {buildingTypeOptions.map((type) => (
                        <motion.button
                          key={type.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleTypeChange(index, type.value)}
                          className={`p-3 border-2 rounded-lg text-center transition-colors ${
                            buildingTypes[index] === type.value
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                          }`}
                        >
                          <div className="text-2xl mb-1">{type.icon}</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {type.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {type.description}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Building Capacity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Capacity
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {capacityOptions.map((capacity) => (
                        <motion.button
                          key={capacity.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleCapacityChange(index, capacity.value)}
                          className={`p-3 border-2 rounded-lg text-center transition-colors ${
                            buildingCapacities[index] === capacity.value
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {capacity.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {capacity.description}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </motion.button>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Building Setup
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Configure your farm buildings for optimal management
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
              <div key={index} className="flex items-center">
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
                    <Building className="w-5 h-5" />
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
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Building className="w-8 h-8 text-blue-600" />
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
                  {steps[currentStep].description}
                </motion.p>
              </div>
              
              <AnimatePresence mode="wait">
                {steps[currentStep].component}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Setting up...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        <span>Complete Setup</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
