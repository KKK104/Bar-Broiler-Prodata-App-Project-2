"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { User, Plus, Edit, Trash2, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Safe interface that matches your current database exactly
interface SafeParticipant {
  id: number  // Your database uses integer, not string
  name: string
  code: string
  farm_id: string
  access_tools: string[]
  created_at: string
  updated_at: string
  user_id?: string
}

interface ParticipantManagementSafeProps {
  farmId: string
}

export function ParticipantManagementSafe({ farmId }: ParticipantManagementSafeProps) {
  const [participants, setParticipants] = useState<SafeParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState({ name: '', access_tools: [] as string[] })
  const [isAdding, setIsAdding] = useState(false)
  const [newParticipant, setNewParticipant] = useState({ name: '', access_tools: [] as string[] })
  const [error, setError] = useState<string | null>(null)

  const accessTools = ["Production Input", "Production Performance", "Cost Management", "Harvest Input", "Harvest Output"]

  useEffect(() => {
    fetchParticipants()
  }, [farmId])

  const fetchParticipants = async () => {
    console.log('🔄 Fetching participants for farm:', farmId)
    setError(null)
    
    try {
      // Simple query without complex RLS that might cause recursion
      const { data, error } = await supabase
        .from('participants')
        .select(`
          id,
          name,
          code,
          farm_id,
          access_tools,
          created_at,
          updated_at,
          user_id
        `)
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Database error:', error)
        setError(`Database error: ${error.message}`)
        return
      }
      
      console.log('✅ Successfully fetched participants:', data)
      
      // Ensure access_tools is always an array
      const processedParticipants = (data || []).map(participant => ({
        ...participant,
        access_tools: Array.isArray(participant.access_tools) ? participant.access_tools : []
      }))
      
      setParticipants(processedParticipants)
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      setError(`Unexpected error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (participant: SafeParticipant) => {
    console.log('✏️ Editing participant:', participant)
    setEditingId(participant.id)
    setEditData({
      name: participant.name,
      access_tools: participant.access_tools || []
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editData.name.trim()) {
      alert('Please enter a participant name')
      return
    }

    console.log('💾 Saving participant:', editingId, editData)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('participants')
        .update({
          name: editData.name.trim(),
          access_tools: editData.access_tools,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId)
        .select()

      if (error) {
        console.error('💾 Update error:', error)
        setError(`Update failed: ${error.message}`)
        return
      }

      console.log('💾 Successfully updated participant:', data)

      // Update local state
      setParticipants(prev => 
        prev.map(p => 
          p.id === editingId 
            ? { ...p, name: editData.name.trim(), access_tools: editData.access_tools, updated_at: new Date().toISOString() }
            : p
        )
      )

      setEditingId(null)
      alert('Participant updated successfully!')
    } catch (error) {
      console.error('💾 Unexpected error during save:', error)
      setError(`Save failed: ${error.message}`)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this participant?')) return

    console.log('🗑️ Deleting participant:', id)
    setError(null)

    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('🗑️ Delete error:', error)
        setError(`Delete failed: ${error.message}`)
        return
      }

      console.log('🗑️ Successfully deleted participant')
      setParticipants(prev => prev.filter(p => p.id !== id))
      alert('Participant deleted successfully.')
    } catch (error) {
      console.error('🗑️ Unexpected error during delete:', error)
      setError(`Delete failed: ${error.message}`)
    }
  }

  const handleAddParticipant = async () => {
    if (!newParticipant.name.trim()) {
      alert('Please enter a participant name')
      return
    }
    
    if (newParticipant.access_tools.length === 0) {
      alert('Please select at least one access tool')
      return
    }

    console.log('➕ Adding participant:', newParticipant)
    setError(null)

    try {
      const participantData = {
        name: newParticipant.name.trim(),
        access_tools: newParticipant.access_tools,
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        farm_id: farmId
      }

      console.log('➕ Insert data:', participantData)

      const { data, error } = await supabase
        .from('participants')
        .insert(participantData)
        .select()
        .single()

      if (error) {
        console.error('➕ Insert error:', error)
        setError(`Failed to add participant: ${error.message}`)
        return
      }

      console.log('➕ Successfully added participant:', data)

      setParticipants(prev => [data, ...prev])
      setNewParticipant({ name: '', access_tools: [] })
      setIsAdding(false)
      alert('Participant added successfully!')
    } catch (error) {
      console.error('➕ Unexpected error during add:', error)
      setError(`Add failed: ${error.message}`)
    }
  }

  const toggleAccessTool = (tool: string, isEdit = false) => {
    if (isEdit) {
      setEditData(prev => ({
        ...prev,
        access_tools: prev.access_tools.includes(tool)
          ? prev.access_tools.filter(t => t !== tool)
          : [...prev.access_tools, tool]
      }))
    } else {
      setNewParticipant(prev => ({
        ...prev,
        access_tools: prev.access_tools.includes(tool)
          ? prev.access_tools.filter(t => t !== tool)
          : [...prev.access_tools, tool]
      }))
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading participants...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setError(null)}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Participant Management */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <User size={24} />
              <h2 className="text-xl font-bold">Manage Participants</h2>
              <Badge variant="secondary">{participants.length} participants</Badge>
            </div>
            <Button
              onClick={() => setIsAdding(true)}
              disabled={isAdding}
              className="flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Participant</span>
            </Button>
          </div>

          {/* Add New Participant Form */}
          {isAdding && (
            <Card className="mb-6 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add New Participant</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Participant Name</label>
                  <Input
                    placeholder="Enter participant name"
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Access Tools</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {accessTools.map(tool => (
                      <label 
                        key={tool} 
                        className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={newParticipant.access_tools.includes(tool)}
                          onChange={() => toggleAccessTool(tool)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">{tool}</span>
                      </label>
                    ))}
                  </div>
                  {newParticipant.access_tools.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Please select at least one access tool</p>
                  )}
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    onClick={handleAddParticipant}
                    disabled={!newParticipant.name.trim() || newParticipant.access_tools.length === 0}
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle size={16} />
                    <span>Add Participant</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false)
                      setNewParticipant({ name: '', access_tools: [] })
                      setError(null)
                    }}
                    className="flex items-center space-x-2"
                  >
                    <span>Cancel</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Participants List */}
          <div className="space-y-4">
            {participants.map(participant => (
              <Card key={participant.id} className="border border-gray-200">
                {editingId === participant.id ? (
                  // Edit Mode
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Participant Name</label>
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter participant name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Access Tools</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {accessTools.map(tool => (
                            <label 
                              key={tool} 
                              className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={editData.access_tools.includes(tool)}
                                onChange={() => toggleAccessTool(tool, true)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium">{tool}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button
                          onClick={handleSaveEdit}
                          disabled={!editData.name.trim()}
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <CheckCircle size={14} />
                          <span>Save Changes</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingId(null)
                            setError(null)
                          }}
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <span>Cancel</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  // View Mode
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{participant.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            ID: {participant.id}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <User size={14} />
                            <span>Code: <span className="font-mono font-semibold">{participant.code}</span></span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Shield size={14} />
                            <span>
                              Access: {participant.access_tools.length > 0 
                                ? participant.access_tools.join(', ')
                                : 'No access assigned'
                              }
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex flex-wrap gap-1">
                          {participant.access_tools.map(tool => (
                            <Badge key={tool} variant="secondary" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => handleEdit(participant)}
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(participant.id)}
                          size="sm"
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            {participants.length === 0 && !error && (
              <div className="text-center py-12 text-gray-500">
                <User size={64} className="mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No participants found</h3>
                <p className="text-sm mb-4">Add your first participant to get started</p>
                <Button onClick={() => setIsAdding(true)}>
                  <Plus size={16} className="mr-2" />
                  Add First Participant
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

