'use client'

import { useState } from 'react'
import { usePerformanceStandards, PerformanceStandard } from '@/hooks/usePerformanceStandards'

interface StandardSelectorProps {
  farmId: string
  onStandardChange?: (standard: PerformanceStandard) => void
}

export function StandardSelector({ farmId, onStandardChange }: StandardSelectorProps) {
  const {
    standards,
    selectedStandard,
    setSelectedStandard,
    addCustomStandard,
    deleteCustomStandard,
    loading,
    error
  } = usePerformanceStandards(farmId)

  const [showAddModal, setShowAddModal] = useState(false)
  const [newStandard, setNewStandard] = useState({
    name: '',
    mortality_rate: '',
    fcr: '',
    avg_weight: '',
    adg: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleStandardChange = (standardId: string) => {
    const standard = standards.find(s => s.id === standardId)
    if (standard) {
      setSelectedStandard(standard)
      onStandardChange?.(standard)
    }
  }

  const handleAddCustomStandard = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      await addCustomStandard({
        name: newStandard.name,
        mortality_rate: parseFloat(newStandard.mortality_rate),
        fcr: parseFloat(newStandard.fcr),
        avg_weight: parseFloat(newStandard.avg_weight),
        adg: parseFloat(newStandard.adg)
      })

      // Reset form and close modal
      setNewStandard({
        name: '',
        mortality_rate: '',
        fcr: '',
        avg_weight: '',
        adg: ''
      })
      setShowAddModal(false)
      
      alert('Custom standard added successfully!')
    } catch (err) {
      console.error('Error adding custom standard:', err)
      alert(err instanceof Error ? err.message : 'Failed to add custom standard')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteStandard = async (standardId: string, standardName: string) => {
    if (!confirm(`Are you sure you want to delete "${standardName}"?`)) return

    try {
      await deleteCustomStandard(standardId)
      alert('Custom standard deleted successfully!')
    } catch (err) {
      console.error('Error deleting standard:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete custom standard')
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Performance Standard</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium w-full sm:w-auto sm:px-4 sm:py-2"
        >
          Add
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Standard Selector Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Standard
          </label>
          <select
            value={selectedStandard.id}
            onChange={(e) => handleStandardChange(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <optgroup label="Built-in Standards">
              {standards.filter(s => !s.is_custom).map(standard => (
                <option key={standard.id} value={standard.id}>
                  {standard.name}
                </option>
              ))}
            </optgroup>
            {standards.filter(s => s.is_custom).length > 0 && (
              <optgroup label="Custom Standards">
                {standards.filter(s => s.is_custom).map(standard => (
                  <option key={standard.id} value={standard.id}>
                    {standard.name} (Custom)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Selected Standard Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">
            {selectedStandard.name} Standard
            {selectedStandard.is_custom && (
              <button
                onClick={() => handleDeleteStandard(selectedStandard.id, selectedStandard.name)}
                className="ml-2 text-red-600 hover:text-red-800 text-sm"
              >
                (Delete)
              </button>
            )}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Mortality Rate:</span>
              <div className="font-semibold">{selectedStandard.mortality_rate}%</div>
            </div>
            <div>
              <span className="text-gray-600">FCR:</span>
              <div className="font-semibold">{selectedStandard.fcr}</div>
            </div>
            <div>
              <span className="text-gray-600">Avg Weight:</span>
              <div className="font-semibold">{selectedStandard.avg_weight}g</div>
            </div>
            <div>
              <span className="text-gray-600">ADG:</span>
              <div className="font-semibold">{selectedStandard.adg}g/day</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Standard Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add Custom Standard</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomStandard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standard Name
                </label>
                <input
                  type="text"
                  value={newStandard.name}
                  onChange={(e) => setNewStandard(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Custom Standard 1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mortality Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newStandard.mortality_rate}
                    onChange={(e) => setNewStandard(prev => ({ ...prev, mortality_rate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FCR
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newStandard.fcr}
                    onChange={(e) => setNewStandard(prev => ({ ...prev, fcr: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1.75"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avg Weight (g)
                  </label>
                  <input
                    type="number"
                    value={newStandard.avg_weight}
                    onChange={(e) => setNewStandard(prev => ({ ...prev, avg_weight: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ADG (g/day)
                  </label>
                  <input
                    type="number"
                    value={newStandard.adg}
                    onChange={(e) => setNewStandard(prev => ({ ...prev, adg: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="70"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Standard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 