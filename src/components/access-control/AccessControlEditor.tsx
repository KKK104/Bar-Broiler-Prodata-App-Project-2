"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { 
  User, 
  Shield, 
  Clock, 
  Building, 
  Eye, 
  Edit, 
  Settings,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { 
  AccessLevel, 
  Role, 
  Permission, 
  RoleDefinitions,
  AccessControlEngine
} from "@/lib/access-control/AccessControlSystem"

interface ParticipantAccessData {
  id: string
  name: string
  code: string
  level: AccessLevel
  role: Role
  buildingIds?: string[]
  workingHours?: {
    start: string
    end: string
    days: number[]
  }
  restrictions?: string[]
  temporaryElevations?: {
    permissions: Permission[]
    expiresAt: Date
    reason: string
  }[]
}

interface AccessControlEditorProps {
  participant: ParticipantAccessData
  availableBuildings: { id: string; name: string }[]
  onSave: (data: ParticipantAccessData) => Promise<void>
  onCancel: () => void
}

export function AccessControlEditor({ 
  participant, 
  availableBuildings, 
  onSave, 
  onCancel 
}: AccessControlEditorProps) {
  const [editData, setEditData] = useState<ParticipantAccessData>(participant)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Get current permissions based on level and role
  const currentPermissions = AccessControlEngine.getUserPermissions({
    id: editData.id,
    level: editData.level,
    role: editData.role,
    farmId: 'current-farm',
    buildingIds: editData.buildingIds,
    experience: 0,
    certifications: []
  })

  const handleLevelChange = (newLevel: AccessLevel) => {
    setEditData(prev => ({
      ...prev,
      level: newLevel,
      // Auto-adjust role if it doesn't meet minimum level requirement
      role: RoleDefinitions[prev.role].minLevel > newLevel 
        ? Role.FARM_WORKER 
        : prev.role
    }))
  }

  const handleRoleChange = (newRole: Role) => {
    const roleDefinition = RoleDefinitions[newRole]
    setEditData(prev => ({
      ...prev,
      role: newRole,
      // Auto-adjust level if current level is below role requirement
      level: prev.level < roleDefinition.minLevel 
        ? roleDefinition.minLevel 
        : prev.level
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(editData)
    } catch (error) {
      console.error('Error saving access control:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getLevelColor = (level: AccessLevel): string => {
    switch (level) {
      case AccessLevel.LEVEL_1_VIEWER: return "bg-gray-100 text-gray-800"
      case AccessLevel.LEVEL_2_RECORDER: return "bg-blue-100 text-blue-800"
      case AccessLevel.LEVEL_3_ANALYST: return "bg-green-100 text-green-800"
      case AccessLevel.LEVEL_4_MANAGER: return "bg-orange-100 text-orange-800"
      case AccessLevel.LEVEL_5_ADMIN: return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: Role): string => {
    const colors = {
      [Role.FARM_WORKER]: "bg-blue-100 text-blue-800",
      [Role.PRODUCTION_SUPERVISOR]: "bg-green-100 text-green-800",
      [Role.FEED_MANAGER]: "bg-yellow-100 text-yellow-800",
      [Role.HARVEST_COORDINATOR]: "bg-purple-100 text-purple-800",
      [Role.BUILDING_MANAGER]: "bg-orange-100 text-orange-800",
      [Role.FARM_ANALYST]: "bg-indigo-100 text-indigo-800",
      [Role.FARM_OWNER]: "bg-red-100 text-red-800"
    }
    return colors[role] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <User className="h-6 w-6 text-gray-600" />
          <div>
            <h2 className="text-xl font-semibold">{editData.name}</h2>
            <p className="text-sm text-gray-500">Code: {editData.code}</p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Shield className="h-3 w-3" />
          <span>Access Control</span>
        </Badge>
      </div>

      {/* Main Access Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Access Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Access Level</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {Object.values(AccessLevel).filter(v => typeof v === 'number').map((level) => (
                <label 
                  key={level} 
                  className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="accessLevel"
                    value={level}
                    checked={editData.level === level}
                    onChange={() => handleLevelChange(level as AccessLevel)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Level {level}</span>
                      <Badge className={getLevelColor(level as AccessLevel)}>
                        {AccessLevel[level as AccessLevel].replace('LEVEL_', '').replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {level === AccessLevel.LEVEL_1_VIEWER && "View basic farm data"}
                      {level === AccessLevel.LEVEL_2_RECORDER && "Record daily production data"}
                      {level === AccessLevel.LEVEL_3_ANALYST && "Generate reports and analytics"}
                      {level === AccessLevel.LEVEL_4_MANAGER && "Manage buildings and operations"}
                      {level === AccessLevel.LEVEL_5_ADMIN && "Full administrative access"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Job Role</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {Object.entries(RoleDefinitions).map(([roleKey, definition]) => {
                const isDisabled = editData.level < definition.minLevel
                return (
                  <label 
                    key={roleKey}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer ${
                      isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={roleKey}
                      checked={editData.role === roleKey}
                      disabled={isDisabled}
                      onChange={() => handleRoleChange(roleKey as Role)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{definition.name}</span>
                        <Badge className={getRoleColor(roleKey as Role)}>
                          Min Level {definition.minLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {definition.description}
                      </p>
                      {isDisabled && (
                        <p className="text-xs text-red-500 mt-1 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Requires Level {definition.minLevel} or higher
                        </p>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Permissions Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Current Permissions</span>
            </div>
            <Badge variant="secondary">
              {currentPermissions.length} permissions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {currentPermissions.map((permission) => (
              <Badge 
                key={permission} 
                variant="outline" 
                className="text-xs justify-center py-1"
              >
                {permission.replace(/_/g, ' ').toLowerCase()}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Advanced Options</span>
            </div>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        
        {showAdvanced && (
          <CardContent className="space-y-4">
            
            {/* Building Access */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                Building Access
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!editData.buildingIds || editData.buildingIds.length === 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditData(prev => ({ ...prev, buildingIds: undefined }))
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-green-600">All Buildings</span>
                </label>
                {availableBuildings.map((building) => (
                  <label key={building.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editData.buildingIds?.includes(building.id) || false}
                      onChange={(e) => {
                        const buildingIds = editData.buildingIds || []
                        if (e.target.checked) {
                          setEditData(prev => ({ 
                            ...prev, 
                            buildingIds: [...buildingIds, building.id] 
                          }))
                        } else {
                          setEditData(prev => ({ 
                            ...prev, 
                            buildingIds: buildingIds.filter(id => id !== building.id) 
                          }))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{building.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Working Hours Restriction
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={!!editData.workingHours}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditData(prev => ({
                        ...prev,
                        workingHours: {
                          start: "06:00",
                          end: "18:00",
                          days: [1, 2, 3, 4, 5] // Mon-Fri
                        }
                      }))
                    } else {
                      setEditData(prev => ({ ...prev, workingHours: undefined }))
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">Restrict access to working hours only</span>
              </div>
              
              {editData.workingHours && (
                <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Start Time</label>
                      <Input
                        type="time"
                        value={editData.workingHours.start}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          workingHours: prev.workingHours ? {
                            ...prev.workingHours,
                            start: e.target.value
                          } : undefined
                        }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">End Time</label>
                      <Input
                        type="time"
                        value={editData.workingHours.end}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          workingHours: prev.workingHours ? {
                            ...prev.workingHours,
                            end: e.target.value
                          } : undefined
                        }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            'Save Access Control'
          )}
        </Button>
      </div>
    </div>
  )
}

