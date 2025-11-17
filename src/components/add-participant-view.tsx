"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ChevronLeft, RefreshCw } from "lucide-react"

interface AddParticipantViewProps {
  onBack: () => void
  onGetStarted?: () => void
  onAddParticipant: (participant: { name: string; code: string; access_tools: string[] }) => Promise<void>
  isNewAccount: boolean
  editingParticipant?: { id: number; name: string; code: string; access_tools?: string[] } | null
}

export function AddParticipantView({
  onBack,
  onGetStarted,
  onAddParticipant,
  isNewAccount,
  editingParticipant,
}: AddParticipantViewProps) {
  const [participantName, setParticipantName] = useState(editingParticipant?.name || "")
  const [generatedCode, setGeneratedCode] = useState(editingParticipant?.code || "")
  const [selectedAccessTools, setSelectedAccessTools] = useState<string[]>(editingParticipant?.access_tools || [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const accessTools = ["Production Input", "Production Performance", "Cost Management", "Harvest Input", "Harvest Output"]

  const toggleAccessTool = (tool: string) => {
    setSelectedAccessTools(prev => 
      prev.includes(tool) 
        ? prev.filter(t => t !== tool)
        : [...prev, tool]
    )
  }

  const generateCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedCode(code)
  }

  // Generate code on mount if not editing
  useEffect(() => {
    if (!editingParticipant && !generatedCode) {
      generateCode()
    }
  }, [editingParticipant, generatedCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!participantName.trim()) {
      alert("Please enter a participant name")
      return
    }

    if (!generatedCode.trim()) {
      alert("Please enter an access code")
      return
    }

    setIsSubmitting(true)
    
    try {
      await onAddParticipant({
        name: participantName.trim(),
        code: generatedCode.trim(),
        access_tools: selectedAccessTools,
      })
      
      // Reset form if not editing
      if (!editingParticipant) {
        setParticipantName("")
        setSelectedAccessTools([])
        generateCode()
      }
    } catch (error) {
      alert('Error saving participant. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-gray-200 rounded-full"
            disabled={isSubmitting}
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {editingParticipant ? "Edit Participant" : "Add Participant"}
            </h1>
            <p className="text-gray-600 mt-1">
              {editingParticipant 
                ? "Update participant information" 
                : "Add a new participant to your farm"
              }
            </p>
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
                className="w-full"
                disabled={isSubmitting}
              />
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
                  disabled={isSubmitting}
                  className="px-3"
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access to tools
              </label>
              <div className="space-y-2">
                {accessTools.map((tool) => (
                  <label key={tool} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAccessTools.includes(tool)}
                      onChange={() => toggleAccessTool(tool)}
                      disabled={isSubmitting}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{tool}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !participantName.trim()}
              className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{editingParticipant ? "Updating..." : "Adding..."}</span>
                </div>
              ) : (
                editingParticipant ? "Update Participant" : "Add Participant"
              )}
            </Button>
            
            {isNewAccount && onGetStarted && (
              <Button
                variant="outline"
                onClick={onGetStarted}
                disabled={isSubmitting}
                className="w-full"
              >
                Skip for now
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
