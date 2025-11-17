"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent } from "../ui/card"
import { User, Check, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ParticipantSetupFormProps {
  onComplete: () => void
  onSkip: () => void
  userId?: string
}

export function ParticipantSetupForm({ onComplete, onSkip, userId }: ParticipantSetupFormProps) {
  const [participantName, setParticipantName] = useState("")
  const [selectedAccessTools, setSelectedAccessTools] = useState<string[]>([])
  const [generatedCode, setGeneratedCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [farmId, setFarmId] = useState<string | null>(null)

  const accessTools = ["Production Input", "Production Performance", "Cost Management", "Harvest Input", "Harvest Output"]

  // Get the farm ID for the current user
  useEffect(() => {
    const getFarmId = async () => {
      if (!userId) return

      const { data, error } = await supabase
        .from('farms')
        .select('id')
        .eq('owner_id', userId)
        .single()

      if (data) {
        setFarmId(data.id)
      }
    }

    getFarmId()
  }, [userId])

  const generateCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedCode(code)
  }

  useEffect(() => {
    generateCode()
  }, [])

  const toggleAccessTool = (tool: string) => {
    setSelectedAccessTools(prev => 
      prev.includes(tool) 
        ? prev.filter(t => t !== tool)
        : [...prev, tool]
    )
  }

  const handleSubmit = async () => {
    if (!participantName.trim() || selectedAccessTools.length === 0 || !farmId) {
      alert("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('participants')
        .insert([{
          name: participantName.trim(),
          access_tools: selectedAccessTools,
          code: generatedCode,
          farm_id: farmId
        }])

      if (error) throw error

      onComplete()
    } catch (error) {
      console.error('Error adding participant:', error)
      alert('Error adding participant. Please try again.')
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
              <User className="mx-auto mb-4 text-gray-600" size={48} />
              <h1 className="text-2xl font-bold">Add Your First Participant</h1>
              <p className="text-gray-600 mt-1">Set up access for farm workers</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter participant name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Access to tools
                </label>
                <div className="space-y-2">
                  {accessTools.map((tool) => (
                    <label key={tool} className="flex items-center space-x-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedAccessTools.includes(tool)}
                          onChange={() => toggleAccessTool(tool)}
                          className="sr-only"
                          disabled={isLoading}
                        />
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                          selectedAccessTools.includes(tool)
                            ? 'bg-black border-black'
                            : 'border-gray-300'
                        }`}>
                          {selectedAccessTools.includes(tool) && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-gray-700">{tool}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant Code
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={generatedCode}
                    readOnly
                    className="flex-1 bg-gray-50 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCode}
                    disabled={isLoading}
                    className="px-3"
                  >
                    <RefreshCw size={16} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <Button
                onClick={handleSubmit}
                className="w-full bg-black text-white hover:bg-gray-800"
                disabled={isLoading || !participantName.trim() || selectedAccessTools.length === 0}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding participant...</span>
                  </div>
                ) : (
                  "Complete Setup"
                )}
              </Button>

              <Button
                variant="outline"
                onClick={onSkip}
                className="w-full"
                disabled={isLoading}
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}