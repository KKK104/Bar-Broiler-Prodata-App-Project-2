"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent } from "../ui/card"
import { User, Plus, Edit, Trash2, Check, X, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AccessControlEditor } from "../access-control/AccessControlEditor"
import { AccessLevel, Role } from "@/lib/access-control/AccessControlSystem"

interface DashboardParticipant {
  id: string
  name: string
  access_tools: string[]  // Legacy field - will be migrated
  access_level?: AccessLevel
  role?: Role
  code: string
  farm_id: string
  building_ids?: string[]
  working_hours?: {
    start: string
    end: string
    days: number[]
  }
}

interface ParticipantManagementProps {
  farmId: string
}

export function ParticipantManagement({ farmId }: ParticipantManagementProps) {
  const [participants, setParticipants] = useState<DashboardParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [availableBuildings, setAvailableBuildings] = useState<{ id: string; name: string }[]>([])
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false)

  useEffect(() => {
    fetchParticipants()
  }, [farmId])

  const fetchParticipants = async () => {
    console.log('🔄 Fetching participants for farm:', farmId)
    
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('farm_id', farmId)

      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      console.log('✅ Successfully fetched participants:', data)
      
      // Ensure access_tools is always an array
      const processedParticipants = (data || []).map(participant => ({
        ...participant,
        access_tools: participant.access_tools || []
      }))
      
      setParticipants(processedParticipants)
    } catch (error) {
      console.error('❌ Error fetching participants:', error)
      
      // More specific error handling
      if (error?.message?.includes('column') && error?.message?.includes('does not exist')) {
        console.error('🚨 Database schema issue detected')
        alert('Database schema needs updating. The participants table is missing required columns.')
      } else if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
        console.error('🚨 Table does not exist')
        alert('Participants table does not exist. Please check your database setup.')
      } else {
        console.error('🚨 General database error:', error)
        alert('Error loading participants. Please check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (participant: DashboardParticipant) => {
    setEditingId(participant.id)
    setEditData({
      name: participant.name,
      access_tools: participant.access_tools
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editData.name.trim()) return

    try {
      const { error } = await supabase
        .from('participants')
        .update({
          name: editData.name.trim(),
          access_tools: editData.access_tools
        })
        .eq('id', editingId)

      if (error) throw error

      setParticipants(prev => 
        prev.map(p => 
          p.id === editingId 
            ? { ...p, name: editData.name.trim(), access_tools: editData.access_tools }
            : p
        )
      )

      setEditingId(null)
    } catch (error) {
      console.error('Error updating participant:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this participant?')) return

    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id)

      if (error) throw error

      setParticipants(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting participant:', error)
    }
  }

  const handleAddParticipant = async () => {
    if (!newParticipant.name.trim() || newParticipant.access_tools.length === 0) return

    try {
      const { data, error } = await supabase
        .from('participants')
        .insert({
          name: newParticipant.name.trim(),
          access_tools: newParticipant.access_tools,
          code: Math.floor(100000 + Math.random() * 900000).toString(),
          farm_id: farmId
        })
        .select()
        .single()

      if (error) throw error

      setParticipants(prev => [...prev, data])
      setNewParticipant({ name: '', access_tools: [] })
      setIsAdding(false)
    } catch (error) {
      console.error('Error adding participant:', error)
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <User size={24} />
            <h2 className="text-xl font-bold">Manage Participants</h2>
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
          <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
            <h3 className="font-medium mb-4">Add New Participant</h3>
            <div className="space-y-4">
              <Input
                placeholder="Participant name"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Access Tools</p>
                <div className="space-y-2">
                  {accessTools.map(tool => (
                    <label key={tool} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newParticipant.access_tools.includes(tool)}
                        onChange={() => toggleAccessTool(tool)}
                        className="rounded"
                      />
                      <span className="text-sm">{tool}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleAddParticipant}
                  disabled={!newParticipant.name.trim() || newParticipant.access_tools.length === 0}
                  className="flex items-center space-x-2"
                >
                  <Check size={16} />
                  <span>Add</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    setNewParticipant({ name: '', access_tools: [] })
                  }}
                  className="flex items-center space-x-2"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Participants List */}
        <div className="space-y-4">
          {participants.map(participant => (
            <div key={participant.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === participant.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <Input
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  />
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Access Tools</p>
                    <div className="space-y-2">
                      {accessTools.map(tool => (
                        <label key={tool} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editData.access_tools.includes(tool)}
                            onChange={() => toggleAccessTool(tool, true)}
                            className="rounded"
                          />
                          <span className="text-sm">{tool}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveEdit}
                      disabled={!editData.name.trim()}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Check size={14} />
                      <span>Save</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingId(null)}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{participant.name}</h3>
                    <p className="text-sm text-gray-600">
                      Code: <span className="font-mono">{participant.code}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Access: {participant.access_tools.join(', ')}
                    </p>
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
              )}
            </div>
          ))}

          {participants.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p>No participants found</p>
              <p className="text-sm">Add your first participant to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}