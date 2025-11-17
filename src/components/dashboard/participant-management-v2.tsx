"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { User, Plus, Edit, Trash2, Shield, Building, Clock, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { AccessControlEditor } from "../access-control/AccessControlEditor"
import { 
  AccessLevel, 
  Role, 
  RoleDefinitions, 
  AccessControlEngine 
} from "@/lib/access-control/AccessControlSystem"

interface ModernParticipant {
  id: string
  name: string
  code: string
  farm_id: string
  access_level: AccessLevel
  role: Role
  building_ids?: string[]
  working_hours?: {
    start: string
    end: string
    days: number[]
  }
  restrictions?: string[]
  created_at: string
  updated_at: string
}

interface ParticipantManagementV2Props {
  farmId: string
}

export function ParticipantManagementV2({ farmId }: ParticipantManagementV2Props) {
  const [participants, setParticipants] = useState<ModernParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [availableBuildings, setAvailableBuildings] = useState<{ id: string; name: string }[]>([])
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    level: AccessLevel.LEVEL_2_RECORDER,
    role: Role.FARM_WORKER
  })

  useEffect(() => {
    fetchParticipants()
    fetchBuildings()
  }, [farmId])

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Handle both legacy and new format
      const processedParticipants = (data || []).map(participant => ({
        ...participant,
        access_level: participant.access_level || AccessLevel.LEVEL_2_RECORDER,
        role: participant.role || Role.FARM_WORKER
      }))
      
      setParticipants(processedParticipants)
    } catch (error) {
      console.error('Error fetching participants:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, name')
        .eq('farm_id', farmId)

      if (error) throw error
      setAvailableBuildings(data || [])
    } catch (error) {
      console.error('Error fetching buildings:', error)
    }
  }

  const handleAddParticipant = async () => {
    if (!newParticipant.name.trim()) return

    try {
      const { data, error } = await supabase
        .from('participants')
        .insert({
          name: newParticipant.name.trim(),
          access_level: newParticipant.level,
          role: newParticipant.role,
          code: Math.floor(100000 + Math.random() * 900000).toString(),
          farm_id: farmId
        })
        .select()
        .single()

      if (error) throw error

      setParticipants(prev => [data, ...prev])
      setNewParticipant({ name: '', level: AccessLevel.LEVEL_2_RECORDER, role: Role.FARM_WORKER })
      setIsAdding(false)
    } catch (error) {
      console.error('Error adding participant:', error)
      alert('Error adding participant. Please try again.')
    }
  }

  const handleSaveEdit = async (updatedData: any) => {
    try {
      const { error } = await supabase
        .from('participants')
        .update({
          name: updatedData.name,
          access_level: updatedData.level,
          role: updatedData.role,
          building_ids: updatedData.buildingIds,
          working_hours: updatedData.workingHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedData.id)

      if (error) throw error

      // Update local state
      setParticipants(prev => 
        prev.map(p => 
          p.id === updatedData.id 
            ? { ...p, ...updatedData, updated_at: new Date().toISOString() }
            : p
        )
      )

      setEditingId(null)
      alert('Participant updated successfully!')
    } catch (error) {
      console.error('Error updating participant:', error)
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this participant? This action cannot be undone.')) return

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

  const getRoleBadge = (role: Role) => {
    const roleDefinition = RoleDefinitions[role]
    return (
      <Badge variant="outline" className="text-xs">
        {roleDefinition.name}
      </Badge>
    )
  }

  const getPermissionCount = (participant: ModernParticipant) => {
    const permissions = AccessControlEngine.getUserPermissions({
      id: participant.id,
      level: participant.access_level,
      role: participant.role,
      farmId: participant.farm_id,
      buildingIds: participant.building_ids,
      experience: 0,
      certifications: []
    })
    return permissions.length
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

  // Show advanced editor
  if (editingId) {
    const participant = participants.find(p => p.id === editingId)
    if (participant) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Edit Access Control</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AccessControlEditor
              participant={{
                id: participant.id,
                name: participant.name,
                code: participant.code,
                level: participant.access_level,
                role: participant.role,
                buildingIds: participant.building_ids,
                workingHours: participant.working_hours
              }}
              availableBuildings={availableBuildings}
              onSave={handleSaveEdit}
              onCancel={() => setEditingId(null)}
            />
          </CardContent>
        </Card>
      )
    }
  }

  return (
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Participant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Participant name"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Access Level</label>
                  <select
                    value={newParticipant.level}
                    onChange={(e) => setNewParticipant(prev => ({ 
                      ...prev, 
                      level: parseInt(e.target.value) as AccessLevel 
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={AccessLevel.LEVEL_1_VIEWER}>Level 1 - Viewer</option>
                    <option value={AccessLevel.LEVEL_2_RECORDER}>Level 2 - Recorder</option>
                    <option value={AccessLevel.LEVEL_3_ANALYST}>Level 3 - Analyst</option>
                    <option value={AccessLevel.LEVEL_4_MANAGER}>Level 4 - Manager</option>
                    <option value={AccessLevel.LEVEL_5_ADMIN}>Level 5 - Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Job Role</label>
                  <select
                    value={newParticipant.role}
                    onChange={(e) => setNewParticipant(prev => ({ 
                      ...prev, 
                      role: e.target.value as Role 
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    {Object.entries(RoleDefinitions).map(([roleKey, definition]) => (
                      <option 
                        key={roleKey} 
                        value={roleKey}
                        disabled={newParticipant.level < definition.minLevel}
                      >
                        {definition.name} (Min Level {definition.minLevel})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleAddParticipant}
                  disabled={!newParticipant.name.trim()}
                  className="flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Participant</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    setNewParticipant({ name: '', level: AccessLevel.LEVEL_2_RECORDER, role: Role.FARM_WORKER })
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
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{participant.name}</h3>
                      {getLevelBadge(participant.access_level)}
                      {getRoleBadge(participant.role)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User size={14} />
                        <span>Code: <span className="font-mono">{participant.code}</span></span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Shield size={14} />
                        <span>{getPermissionCount(participant)} permissions</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {participant.building_ids ? (
                          <>
                            <Building size={14} />
                            <span>{participant.building_ids.length} buildings</span>
                          </>
                        ) : (
                          <>
                            <Eye size={14} />
                            <span>All buildings</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {participant.working_hours && (
                      <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>
                          Working hours: {participant.working_hours.start} - {participant.working_hours.end}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingId(participant.id)}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Shield size={14} />
                      <span>Manage Access</span>
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
            </Card>
          ))}

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
  )
}

