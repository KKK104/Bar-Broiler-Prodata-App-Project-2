"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent } from "../ui/card"
import { Plus, Minus, Home } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface BuildingSetupFormProps {
  onComplete: () => void
  userId?: string
}

export function BuildingSetupForm({ onComplete, userId }: BuildingSetupFormProps) {
  const [buildingCount, setBuildingCount] = useState(1)
  const [buildingNames, setBuildingNames] = useState<string[]>(["Building 1"])
  const [isLoading, setIsLoading] = useState(false)

  const handleCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 10) return
    
    setBuildingCount(newCount)
    
    const newNames = Array.from({ length: newCount }, (_, i) => 
      buildingNames[i] || `Building ${i + 1}`
    )
    setBuildingNames(newNames)
  }

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...buildingNames]
    newNames[index] = name
    setBuildingNames(newNames)
  }

  const handleSubmit = async () => {
    if (!userId) return

    setIsLoading(true)

    try {
      // Create farm first
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .insert([{
          name: 'My Farm',
          owner_id: userId,
          building_count: buildingCount
        }])
        .select()
        .single()

      if (farmError) throw farmError

      // Create buildings
      const buildingsToInsert = buildingNames.map((name, index) => ({
        name: name.trim() || 'Unnamed Building',
        farm_id: farmData.id,
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <Home className="mx-auto mb-4 text-gray-600" size={48} />
              <h1 className="text-2xl font-bold">Setup Your Buildings</h1>
              <p className="text-gray-600 mt-1">How many buildings does your farm have?</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Buildings
                </label>
                <div className="flex items-center space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCountChange(buildingCount - 1)}
                    disabled={buildingCount <= 1}
                  >
                    <Minus size={16} />
                  </Button>
                  
                  <span className="text-2xl font-bold w-12 text-center">
                    {buildingCount}
                  </span>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCountChange(buildingCount + 1)}
                    disabled={buildingCount >= 10}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building Names
                </label>
                <div className="space-y-2">
                  {buildingNames.map((name, index) => (
                    <Input
                      key={index}
                      type="text"
                      placeholder={`Building ${index + 1}`}
                      value={name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Setting up buildings...</span>
                  </div>
                ) : (
                  "Next: Add Participants"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}