"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { User, Plus, Edit, Trash2, Shield, Building, Clock, Eye, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Legacy participant interface (current database schema)
interface LegacyParticipant {
  id: string
  name: string
  code: string
  farm_id: string
  access_tools: string[]
  created_at: string
  updated_at: string
  user_id?: string
}

// Modern access levels (mapped from legacy tools)
enum AccessLevel {
  LEVEL_1_VIEWER = 1,
  LEVEL_2_RECORDER = 2,
  LEVEL_3_ANALYST = 3,
  LEVEL_4_MANAGER = 4,
  LEVEL_5_ADMIN = 5
}

enum Role {
  FARM_WORKER = 'farm_worker',
  PRODUCTION_SUPERVISOR = 'production_supervisor',
  FEED_MANAGER = 'feed_manager',
  HARVEST_COORDINATOR = 'harvest_coordinator',
  BUILDING_MANAGER = 'building_manager',
  FARM_ANALYST = 'farm_analyst',
  FARM_OWNER = 'farm_owner'
}

interface ParticipantManagementCompatibleProps {
  farmId: string
}

export function ParticipantManagementCompatible({ farmId }: ParticipantManagementCompatibleProps) {
  const [participants, setParticipants] = useState<LegacyParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', access_tools: [] as string[] })
  const [isAdding, setIsAdding] = useState(false)
  const [newParticipant, setNewParticipant] = useState({ name: '', access_tools: [] as string[] })
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const accessTools = ["Production Input", "Production Performance", "Cost Management", "Harvest Input", "Harvest Output"]

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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Database error:', error)
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
      
      // Show user-friendly error message
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        alert('Database schema needs updating. Please run the database migration first.')
      } else {
        alert('Error loading participants. Please check your connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (participant: LegacyParticipant) => {
    setEditingId(participant.id)
    setEditData({
      name: participant.name,
      access_tools: participant.access_tools || []
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editData.name.trim()) return

    console.log('💾 Saving participant with access_tools:', editData.access_tools)

    try {
      const { data, error } = await supabase
        .from('participants')
        .update({
          name: editData.name.trim(),
          access_tools: editData.access_tools
        })
        .eq('id', editingId)
        .select()

      if (error) {
        console.error('💾 Database error:', error)
        alert(`Error updating participant: ${error.message}`)
        return
      }

      console.log('💾 Successfully updated participant:', data)

      setParticipants(prev => 
        prev.map(p => 
          p.id === editingId 
            ? { ...p, name: editData.name.trim(), access_tools: editData.access_tools }
            : p
        )
      )

      setEditingId(null)
      alert('Participant updated successfully!')
    } catch (error) {
      console.error('💾 Unexpected error during save:', error)
      alert(`Unexpected error: ${error.message}`)
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
      alert('Participant deleted successfully.')
    } catch (error) {
      console.error('Error deleting participant:', error)
      alert('Error deleting participant. Please try again.')
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

      setParticipants(prev => [data, ...prev])
      setNewParticipant({ name: '', access_tools: [] })
      setIsAdding(false)
    } catch (error) {
      console.error('Error adding participant:', error)
      alert('Error adding participant. Please try again.')
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

  // Map legacy access tools to modern level/role for display
  const getLegacyAccessLevel = (accessTools: string[]): AccessLevel => {
    if (accessTools.includes("Harvest Output")) return AccessLevel.LEVEL_5_ADMIN
    if (accessTools.includes("Cost Management")) return AccessLevel.LEVEL_4_MANAGER
    if (accessTools.includes("Production Performance")) return AccessLevel.LEVEL_3_ANALYST
    if (accessTools.includes("Production Input")) return AccessLevel.LEVEL_2_RECORDER
    return AccessLevel.LEVEL_1_VIEWER
  }

  const getLegacyRole = (accessTools: string[]): Role => {
    if (accessTools.includes("Harvest Output")) return Role.FARM_OWNER
    if (accessTools.includes("Cost Management")) return Role.BUILDING_MANAGER
    if (accessTools.includes("Harvest Input") && accessTools.includes("Harvest Output")) return Role.HARVEST_COORDINATOR
    if (accessTools.includes("Production Performance")) return Role.FARM_ANALYST
    return Role.FARM_WORKER
  }

  const getLevelBadge = (level: AccessLevel) => {
    const colors = {
      [AccessLevel.LEVEL_1_VIEWER]: "bg-gray-100 text-gray-800",
      [AccessLevel.LEVEL_2_RECORDER]: "bg-blue-100 text-blue-800", 
      [AccessLevel.LEVEL_3_ANALYST]: "bg-green-100 text-green-800",
      [AccessLevel.LEVEL_4_MANAGER]: "bg-orange-100 text-orange-800",
      [AccessLevel.LEVEL_5_ADMIN]: "bg-red-100 text-red-800"
    }
    
    return (
      <Badge className={colors[level] || "bg-gray-100 text-gray-800"}>
        Level {level}
      </Badge>
    )
  }

  const getRoleName = (role: Role): string => {
    const roleNames = {
      [Role.FARM_WORKER]: 'Farm Worker',
      [Role.PRODUCTION_SUPERVISOR]: 'Production Supervisor',
      [Role.FEED_MANAGER]: 'Feed Manager',
      [Role.HARVEST_COORDINATOR]: 'Harvest Coordinator',
      [Role.BUILDING_MANAGER]: 'Building Manager',
      [Role.FARM_ANALYST]: 'Farm Analyst',
      [Role.FARM_OWNER]: 'Farm Owner'
    }
    return roleNames[role]
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
      {/* Upgrade Prompt */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900">Advanced Access Control Available</h3>
                <p className="text-sm text-blue-700">
                  Upgrade to hierarchical levels and role-based permissions for better security and management.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowUpgradePrompt(true)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Settings className="h-4 w-4 mr-1" />
              Upgrade System
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <CardTitle>Add New Participant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Participant name"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                />
                
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Access Tools</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {accessTools.map(tool => (
                      <label key={tool} className="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-gray-50">
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
                    <Plus size={16} />
                    <span>Add Participant</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false)
                      setNewParticipant({ name: '', access_tools: [] })
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
            {participants.map(participant => {
              const level = getLegacyAccessLevel(participant.access_tools)
              const role = getLegacyRole(participant.access_tools)
              
              return (
                <Card key={participant.id} className="border border-gray-200">
                  {editingId === participant.id ? (
                    // Edit Mode
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Participant name"
                        />
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Access Tools</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {accessTools.map(tool => (
                              <label key={tool} className="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-gray-50">
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
                            <Shield size={14} />
                            <span>Save</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingId(null)}
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
                            {getLevelBadge(level)}
                            <Badge variant="outline" className="text-xs">
                              {getRoleName(role)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <User size={14} />
                              <span>Code: <span className="font-mono">{participant.code}</span></span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Shield size={14} />
                              <span>Access: {participant.access_tools.join(', ') || 'No access'}</span>
                            </div>
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
              )
            })}

            {participants.length === 0 && (
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

      {/* Upgrade Instructions Modal */}
      {showUpgradePrompt && (
        <Card className="fixed inset-0 z-50 m-4 max-w-2xl mx-auto my-8 max-h-[80vh] overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Upgrade to Advanced Access Control</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">What you'll get:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Hierarchical access levels (1-5)</li>
                <li>• Role-based permissions</li>
                <li>• Time-based access restrictions</li>
                <li>• Building-specific access control</li>
                <li>• Audit logging and compliance</li>
                <li>• Better security and management</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">Migration Steps:</h3>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Run the database migration script</li>
                <li>Your existing access tools will be automatically converted</li>
                <li>Replace this component with the new version</li>
                <li>Test the new access control system</li>
              </ol>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowUpgradePrompt(false)}>
                Later
              </Button>
              <Button onClick={() => {
                alert('Please run the upgrade_access_control_system.sql file in your database, then replace this component with ParticipantManagementV2.')
                setShowUpgradePrompt(false)
              }}>
                Show Migration Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {showUpgradePrompt && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={() => setShowUpgradePrompt(false)}
        />
      )}
    </div>
  )
}

