"use client"

import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { ChevronLeft, Edit, Trash2, User } from "lucide-react"

interface Participant {
  id: number
  name: string
  access: string
  code: string
}

interface ParticipantsListViewProps {
  onBack: () => void
  onAddMore: () => void
  participants: Participant[]
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

export function ParticipantsListView({ 
  onBack, 
  onAddMore, 
  participants, 
  onEdit, 
  onDelete 
}: ParticipantsListViewProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full">
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Participants</h1>
            <p className="text-gray-600 mt-1">
              {participants.length} participant{participants.length !== 1 ? 's' : ''} added
            </p>
          </div>

          {participants.length === 0 ? (
            <Card className="border border-gray-300">
              <CardContent className="p-8 text-center">
                <User className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No participants yet</h3>
                <p className="text-gray-500 mb-4">Add your first participant to get started</p>
                <Button 
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={onAddMore}
                >
                  Add First Participant
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {participants.map((participant) => (
                <Card key={participant.id} className="border border-gray-300 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="text-white" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 mb-1 truncate">{participant.name}</h4>
                        <p className="text-sm text-gray-600 mb-1">{participant.access}</p>
                        <p className="text-sm text-gray-500">Code: {participant.code}</p>
                      </div>
                      <div className="flex space-x-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(participant.id)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                            title="Edit participant"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(participant.id)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                            title="Delete participant"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center pt-4">
            <Button 
              className="bg-black text-white hover:bg-gray-800 px-8 py-2 rounded-md" 
              onClick={onAddMore}
            >
              Add More
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
