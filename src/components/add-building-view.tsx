"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent } from "./ui/card"
import { ChevronLeft, CheckCircle, XCircle } from "lucide-react"

interface AddBuildingViewProps {
  onBack: () => void
  onAddBuilding: (building: {
    building_number: number
    name: string
    type: string
    capacity: number
    status: string
    cycle_number?: number
    cycle_start_date?: string
  }) => void
  editingBuilding?: {
    id: string
    building_number?: number
    name: string
    type: string
    capacity: number
    status: string
    cycle_number?: number
    cycle_start_date?: string
  } | null
  usedBuildingNumbers?: number[]
}

export function AddBuildingView({ onBack, onAddBuilding, editingBuilding, usedBuildingNumbers = [] }: AddBuildingViewProps) {
  // Generate available building numbers (1-10 only)
  const allBuildingNumbers = Array.from({ length: 10 }, (_, i) => i + 1)
  
  // Ensure usedBuildingNumbers is an array and filter out used numbers
  // Also handle cases where building_number might be undefined/null
  const usedNumbers = Array.isArray(usedBuildingNumbers) 
    ? usedBuildingNumbers.filter(num => num !== undefined && num !== null)
    : []
  
  const availableBuildingNumbers = allBuildingNumbers.filter(num => {
    const isUsed = usedNumbers.includes(num)
    const isEditingCurrentBuilding = editingBuilding?.building_number === num
    return !isUsed || isEditingCurrentBuilding
  })



  // Get the first available building number for new buildings
  const getDefaultBuildingNumber = () => {
    if (editingBuilding?.building_number) {
      return editingBuilding.building_number
    }
    // For new buildings, find the first available number
    return availableBuildingNumbers[0] || 1
  }

  const [formData, setFormData] = useState({
    building_number: getDefaultBuildingNumber(),
    name: editingBuilding?.name || "",
    status: editingBuilding?.status || "active",
    cycle_number: editingBuilding?.cycle_number || 1,
    cycle_start_date: editingBuilding?.cycle_start_date || new Date().toISOString().split('T')[0]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")
    
    if (!formData.name.trim()) {
      setValidationError("Please enter a building name")
      return
    }

    // Check if building number is already used (for new buildings)
    if (!editingBuilding && usedNumbers.includes(formData.building_number)) {
      setValidationError("This building number is already in use. Please select an available number.")
      return
    }

    setIsLoading(true)
    
    try {
      await onAddBuilding({
        building_number: formData.building_number,
        name: formData.name.trim(),
        type: "general", // Default type since dropdown is removed
        capacity: 0, // Default capacity since field is removed
        status: formData.status,
        cycle_number: formData.cycle_number,
        cycle_start_date: formData.cycle_start_date
      })
    } catch (error) {
      setValidationError("Failed to add building. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
            <ChevronLeft size={24} />
          </button>
        </div>

        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">
              {editingBuilding ? "Edit Building" : "Add New Building"}
            </h2>
            
            {validationError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-600 dark:text-red-400 text-sm">{validationError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Building Number
                </label>
                
                {/* Building numbers summary */}
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700 dark:text-blue-300">
                      <CheckCircle size={16} className="inline mr-1" />
                      {availableBuildingNumbers.length} available
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      <XCircle size={16} className="inline mr-1" />
                      {usedNumbers.length} in use
                    </span>
                  </div>
                  {usedNumbers.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Used: {usedNumbers.sort((a, b) => a - b).join(', ')}
                    </p>
                  )}
                </div>

                <select
                  value={formData.building_number}
                  onChange={e => setFormData({ ...formData, building_number: parseInt(e.target.value) })}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  {availableBuildingNumbers.map(num => (
                    <option key={num} value={num}>
                      Building {num}
                    </option>
                  ))}
                </select>
                
                {/* Show selected number status */}
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle size={16} className="mr-1" />
                    Building {formData.building_number} is available
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Building Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Broiler House A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cycle Number
                </label>
                <select
                  value={formData.cycle_number}
                  onChange={e => setFormData({ ...formData, cycle_number: parseInt(e.target.value) })}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cycle Start Date
                </label>
                <Input
                  type="date"
                  value={formData.cycle_start_date}
                  onChange={(e) => setFormData({ ...formData, cycle_start_date: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={isLoading || (usedNumbers.includes(formData.building_number) && formData.building_number !== editingBuilding?.building_number)}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{editingBuilding ? "Updating..." : "Adding..."}</span>
                  </div>
                ) : (
                  editingBuilding ? "Update Building" : "Add Building"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}