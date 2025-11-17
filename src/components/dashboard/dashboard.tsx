"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Home, Users, LogOut, Plus, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { User } from '@supabase/supabase-js'
import { NavigationHeader } from "../ui/navigation-header"
import { HumidityDisplay } from "../humidity/HumidityDisplay"
import { HumidityModal } from "../humidity/HumidityModal"

interface DashboardProps {
  user: User | null
  onSignOut: () => void
}

interface Farm {
  id: string
  name: string
  building_count: number
}

interface Building {
  id: string
  name: string
}

interface Participant {
  id: string
  name: string
  access_tools: string[]
  code: string
}

export function Dashboard({ user, onSignOut }: DashboardProps) {
  const [farm, setFarm] = useState<Farm | null>(null)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [humidityModalOpen, setHumidityModalOpen] = useState(false)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      try {
        // Get farm data
        const { data: farmData, error: farmError } = await supabase
          .from('farms')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (farmData) {
          setFarm(farmData)

          // Get buildings
          const { data: buildingsData } = await supabase
            .from('buildings')
            .select('*')
            .eq('farm_id', farmData.id)
            .order('created_at', { ascending: true })

          setBuildings(buildingsData || [])

          // Get participants
          const { data: participantsData } = await supabase
            .from('participants')
            .select('*')
            .eq('farm_id', farmData.id)
            .order('created_at', { ascending: false })

          setParticipants(participantsData || [])
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  const handleDeleteBuilding = async (buildingId: string) => {
    if (!confirm('Are you sure you want to delete this building? This will also delete all associated calculator sessions and daily records.')) return

    try {
      // First, delete related calculator_sessions
      const { error: sessionsError } = await supabase
        .from('calculator_sessions')
        .delete()
        .eq('building_id', buildingId)

      if (sessionsError) {
        console.error('Error deleting calculator sessions:', sessionsError)
        throw sessionsError
      }

      // Then, delete related daily_records
      const { error: recordsError } = await supabase
        .from('daily_records')
        .delete()
        .eq('building_id', buildingId)

      if (recordsError) {
        console.error('Error deleting daily records:', recordsError)
        throw recordsError
      }

      // Finally, delete the building
      const { error: buildingError } = await supabase
        .from('buildings')
        .delete()
        .eq('id', buildingId)

      if (buildingError) {
        console.error('Error deleting building:', buildingError)
        throw buildingError
      }

      // Update the local state
      setBuildings(prev => prev.filter(b => b.id !== buildingId))
      
      // Show success message
      alert('Building deleted successfully!')
    } catch (error) {
      console.error('Error deleting building:', error)
      alert('Error deleting building. Please try again.')
    }
  }

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to delete this participant?')) return

    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId)

      if (error) throw error

      setParticipants(prev => prev.filter(p => p.id !== participantId))
    } catch (error) {
      alert('Error deleting participant. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader
        title={farm?.name || 'My Farm'}
        subtitle={`Welcome back, ${user?.user_metadata?.owner_name || user?.email}`}
        userEmail={user?.email}
        farmId={farm?.id}
        onHomeClick={() => {}} // This dashboard doesn't have a home button
        onSignOut={onSignOut}
        onHumidityClick={() => setHumidityModalOpen(true)}
      />

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Buildings Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Home className="text-gray-600" size={20} />
                  <h2 className="text-lg font-semibold">Buildings</h2>
                </div>
                <span className="text-sm text-gray-500">
                  {buildings.length} building{buildings.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {buildings.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-500">No buildings yet</p>
                  </div>
                ) : (
                  buildings.map((building) => (
                    <div
                      key={building.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Home className="text-gray-400" size={16} />
                        <span className="font-medium">{building.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteBuilding(building.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete building"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Participants Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="text-gray-600" size={20} />
                  <h2 className="text-lg font-semibold">Participants</h2>
                </div>
                <span className="text-sm text-gray-500">
                  {participants.length} participant{participants.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-3">
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-500">No participants yet</p>
                  </div>
                ) : (
                  participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{participant.name}</div>
                          <div className="text-sm text-gray-500">
                            Code: {participant.code}
                          </div>
                          <div className="text-sm text-gray-500">
                            Access: {participant.access_tools.join(", ")}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteParticipant(participant.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete participant"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Humidity Monitoring Section */}
          <HumidityDisplay
            userId={user?.id || ''}
            farmId={farm?.id || ''}
            onOpenModal={() => setHumidityModalOpen(true)}
            className="lg:col-span-1"
          />
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Home className="mx-auto mb-2 text-blue-500" size={24} />
              <div className="text-2xl font-bold">{buildings.length}</div>
              <div className="text-sm text-gray-500">Buildings</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="mx-auto mb-2 text-green-500" size={24} />
              <div className="text-2xl font-bold">{participants.length}</div>
              <div className="text-sm text-gray-500">Participants</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-6 h-6 bg-purple-500 rounded mx-auto mb-2"></div>
              <div className="text-2xl font-bold">Active</div>
              <div className="text-sm text-gray-500">Farm Status</div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Humidity Modal */}
      <HumidityModal
        isOpen={humidityModalOpen}
        onClose={() => setHumidityModalOpen(false)}
        userId={user?.id || ''}
        farmId={farm?.id || ''}
      />
    </div>
  )
}