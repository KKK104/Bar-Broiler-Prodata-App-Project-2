'use client'

import { useState, useEffect } from 'react'
import { MortalityChartRecharts } from './MortalityChartRecharts'
import { FCRChartRecharts } from './FCRChartRecharts'
import { WeightChartRecharts } from './WeightChartRecharts'
import { ADGChartRecharts } from './ADGChartRecharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function MultiLineExample() {
  // Standard selection state
  const [selectedStandard, setSelectedStandard] = useState('HUBBARD')
  const [showCustomStandardModal, setShowCustomStandardModal] = useState(false)
  const [customStandards, setCustomStandards] = useState<any[]>([])

  // Load custom standards from localStorage on component mount
  useEffect(() => {
    try {
      const savedStandards = localStorage.getItem('customPerformanceStandards')
      if (savedStandards) {
        const parsed = JSON.parse(savedStandards)
        setCustomStandards(parsed)
      }
    } catch (error) {
      console.error('Failed to load custom standards:', error)
    }
  }, [])

  // Save custom standards to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('customPerformanceStandards', JSON.stringify(customStandards))
    } catch (error) {
      console.error('Failed to save custom standards:', error)
    }
  }, [customStandards])

  // Available standards with comprehensive data
  const standards = {
    HUBBARD: { 
      mortality: 6.5, fcr: 1.9, weight: 2100, adg: 72,
      name: 'HUBBARD'
    },
    ROSS: { 
      mortality: 5.8, fcr: 1.8, weight: 2000, adg: 70,
      name: 'ROSS'
    },
    COBB: { 
      mortality: 5.5, fcr: 1.75, weight: 1950, adg: 68,
      name: 'COBB'
    },
    'INDIAN RIVER': { 
      mortality: 6.2, fcr: 1.85, weight: 2050, adg: 71,
      name: 'INDIAN RIVER'
    },
    'ARBOR ACRES': { 
      mortality: 6.0, fcr: 1.82, weight: 2080, adg: 69,
      name: 'ARBOR ACRES'
    },
    ...Object.fromEntries(customStandards.map(cs => [
      cs.name, 
      { 
        mortality: Number(cs.mortality), 
        fcr: Number(cs.fcr), 
        weight: Number(cs.weight), 
        adg: Number(cs.adg),
        name: cs.name
      }
    ]))
  }

  const currentStandard = standards[selectedStandard as keyof typeof standards]

  // Handle custom standard functionality
  const handleAddCustomStandard = () => {
    setShowCustomStandardModal(true)
  }

  const handleSaveCustomStandard = (newStandard: any) => {
    // Check if name already exists
    const existingStandards = Object.keys(standards)
    if (existingStandards.includes(newStandard.name)) {
      alert(`Standard name "${newStandard.name}" already exists. Please choose a different name.`)
      return
    }

    // Add the new custom standard to the list
    const updatedCustomStandards = [...customStandards, newStandard]
    setCustomStandards(updatedCustomStandards)
    
    // Select the newly created standard
    setSelectedStandard(newStandard.name)
    
    // Close modal
    setShowCustomStandardModal(false)
    
    // Show success message with application notice
    alert(`Custom standard "${newStandard.name}" created and applied successfully! All charts now use your custom standard.`)
  }

  const handleDeleteCustomStandard = (standardName: string) => {
    if (confirm(`Are you sure you want to delete the custom standard "${standardName}"?`)) {
      // Remove from custom standards
      const updatedCustomStandards = customStandards.filter(cs => cs.name !== standardName)
      setCustomStandards(updatedCustomStandards)
      
      // If the deleted standard was selected, switch to HUBBARD
      if (selectedStandard === standardName) {
        setSelectedStandard('HUBBARD')
      }
      
      alert(`Custom standard "${standardName}" deleted successfully!`)
    }
  }

  // Check if current standard is custom
  const isCustomStandard = customStandards.some(cs => cs.name === selectedStandard)
  // Common building configuration
  const buildingsConfig = [
    {
      id: 'building-1',
      name: 'Building 1',
      shortCode: 'B1',
      color: '#3b82f6', // Blue
    },
    {
      id: 'building-2',
      name: 'Building 2',
      shortCode: 'B2',
      color: '#10b981', // Green
    },
    {
      id: 'building-3',
      name: 'Building 3',
      shortCode: 'B3',
      color: '#f59e0b', // Yellow/Orange
    }
  ]

  // Generate comprehensive data for all days (1-35 for mortality)
  const generateMortalityData = () => {
    const standardData = Array.from({ length: 35 }, (_, i) => {
      const day = i + 1
      let mortality = 0
      if (day <= 7) {
        mortality = (currentStandard.mortality * 0.15) * (day / 7)
      } else if (day <= 14) {
        mortality = currentStandard.mortality * 0.15 + (currentStandard.mortality * 0.20) * ((day - 7) / 7)
      } else if (day <= 21) {
        mortality = currentStandard.mortality * 0.35 + (currentStandard.mortality * 0.25) * ((day - 14) / 7)
      } else if (day <= 28) {
        mortality = currentStandard.mortality * 0.60 + (currentStandard.mortality * 0.25) * ((day - 21) / 7)
      } else {
        mortality = currentStandard.mortality * 0.85 + (currentStandard.mortality * 0.15) * ((day - 28) / 7)
      }
      return { day, standard: mortality, actual: 0 }
    })

    // Generate actual data for each building
    const buildingsData = buildingsConfig.map((building, index) => {
      const actualData = Array.from({ length: 35 }, (_, i) => {
        const day = i + 1
        let mortality = 0
        if (day <= 7) {
          mortality = (1.2 + index * 0.6) * (day / 7)
        } else if (day <= 14) {
          mortality = 1.2 + index * 0.6 + (1.3 + index * 0.1) * ((day - 7) / 7)
        } else if (day <= 21) {
          mortality = 2.5 + index * 0.7 + (1.3 + index * 0.2) * ((day - 14) / 7)
        } else if (day <= 28) {
          mortality = 3.8 + index * 0.9 + (1.1 + index * 0.3) * ((day - 21) / 7)
        } else {
          mortality = 4.9 + index * 1.2 + (0.9 + index * 0.2) * ((day - 28) / 7)
        }
        return { day, standard: 0, actual: mortality }
      })
      return { ...building, data: actualData }
    })

    return { standardData, buildingsData }
  }

  const { standardData: standardMortalityData, buildingsData: mortalityBuildingsData } = generateMortalityData()

  // Generate FCR data (1-36 days) in Recharts format
  const generateFCRData = () => {
    const standardData = Array.from({ length: 36 }, (_, i) => {
      const day = i + 1
      let fcr = 0.05
      if (day <= 7) {
        fcr = 0.05 + (day - 1) * 0.08
      } else if (day <= 14) {
        fcr = 0.54 + (day - 8) * 0.08
      } else if (day <= 21) {
        fcr = 1.1 + (day - 15) * 0.05
      } else if (day <= 28) {
        fcr = 1.45 + (day - 22) * 0.01
      } else {
        fcr = 1.52 + (day - 29) * 0.005
      }
      return { day, standard: Math.min(fcr, 1.45), actual: 0 }
    })

    // Generate actual data for each building
    const buildingsData = buildingsConfig.map((building, index) => {
      const actualData = Array.from({ length: 36 }, (_, i) => {
        const day = i + 1
        let fcr = 0.0
        if (day <= 7) {
          fcr = 0.0 + (day - 1) * 0.08
        } else if (day <= 14) {
          fcr = 0.48 + (day - 8) * 0.1
        } else if (day <= 21) {
          fcr = 1.18 + (day - 15) * 0.05
        } else if (day <= 28) {
          fcr = 1.48 + (day - 22) * 0.02
        } else {
          fcr = 1.62 + (day - 29) * 0.01
        }
        return { day, standard: 0, actual: Math.min(fcr + index * 0.05, 1.5) }
      })
      return { ...building, data: actualData }
    })

    return { standardData, buildingsData }
  }

  const { standardData: standardFCRData, buildingsData: fcrBuildingsData } = generateFCRData()

  // Generate Weight data (1-35 days) in Recharts format
  const generateWeightData = () => {
    const standardData = Array.from({ length: 35 }, (_, i) => {
      const day = i + 1
      let weight = 45
      if (day <= 7) {
        weight = 45 + (currentStandard.weight - 45) * 0.08 * (day / 7)
      } else if (day <= 14) {
        weight = 45 + (currentStandard.weight - 45) * 0.08 + (currentStandard.weight - 45) * 0.12 * ((day - 7) / 7)
      } else if (day <= 21) {
        weight = 45 + (currentStandard.weight - 45) * 0.20 + (currentStandard.weight - 45) * 0.20 * ((day - 14) / 7)
      } else if (day <= 28) {
        weight = 45 + (currentStandard.weight - 45) * 0.40 + (currentStandard.weight - 45) * 0.25 * ((day - 21) / 7)
      } else {
        weight = 45 + (currentStandard.weight - 45) * 0.65 + (currentStandard.weight - 45) * 0.35 * ((day - 28) / 7)
      }
      return { day, standard: weight, actual: 0 }
    })

    // Generate actual data for each building
    const buildingsData = buildingsConfig.map((building, index) => {
      const actualData = Array.from({ length: 35 }, (_, i) => {
        const day = i + 1
        let weight = 45
        if (day <= 7) {
          weight = 45 + (180 - index * 15 - 45) * (day / 7)
        } else if (day <= 14) {
          weight = 180 - index * 15 + (450 - index * 40 - (180 - index * 15)) * ((day - 7) / 7)
        } else if (day <= 21) {
          weight = 450 - index * 40 + (850 - index * 80 - (450 - index * 40)) * ((day - 14) / 7)
        } else if (day <= 28) {
          weight = 850 - index * 80 + (1400 - index * 120 - (850 - index * 80)) * ((day - 21) / 7)
        } else {
          weight = 1400 - index * 120 + (2100 - index * 150 - (1400 - index * 120)) * ((day - 28) / 7)
        }
        return { day, standard: 0, actual: weight }
      })
      return { ...building, data: actualData }
    })

    return { standardData, buildingsData }
  }

  const { standardData: standardWeightData, buildingsData: weightBuildingsData } = generateWeightData()

  // Generate ADG data (1-35 days) in Recharts format
  const generateADGData = () => {
    const standardData = Array.from({ length: 35 }, (_, i) => {
      const day = i + 1
      let adg = currentStandard.adg * 0.5
      if (day <= 7) {
        adg = currentStandard.adg * 0.5 + (currentStandard.adg * 0.26) * (day / 7)
      } else if (day <= 14) {
        adg = currentStandard.adg * 0.76 + (currentStandard.adg * 0.07) * ((day - 7) / 7)
      } else if (day <= 21) {
        adg = currentStandard.adg * 0.83 + (currentStandard.adg * 0.07) * ((day - 14) / 7)
      } else if (day <= 28) {
        adg = currentStandard.adg * 0.90 + (currentStandard.adg * 0.07) * ((day - 21) / 7)
      } else {
        adg = currentStandard.adg * 0.97 + (currentStandard.adg * 0.03) * ((day - 28) / 7)
      }
      return { day, standard: adg, actual: 0 }
    })

    // Generate actual data for each building
    const buildingsData = buildingsConfig.map((building, index) => {
      const actualData = Array.from({ length: 35 }, (_, i) => {
        const day = i + 1
        let adg = 35 - index * 2
        if (day <= 7) {
          adg = 35 - index * 2 + (55 - index * 3 - (35 - index * 2)) * (day / 7)
        } else if (day <= 14) {
          adg = 55 - index * 3 + (60 - index * 4 - (55 - index * 3)) * ((day - 7) / 7)
        } else if (day <= 21) {
          adg = 60 - index * 4 + (65 - index * 5 - (60 - index * 4)) * ((day - 14) / 7)
        } else if (day <= 28) {
          adg = 65 - index * 5 + (70 - index * 6 - (65 - index * 5)) * ((day - 21) / 7)
        } else {
          adg = 70 - index * 6 + (72 - index * 7 - (70 - index * 6)) * ((day - 28) / 7)
        }
        return { day, standard: 0, actual: adg }
      })
      return { ...building, data: actualData }
    })

    return { standardData, buildingsData }
  }

  const { standardData: standardADGData, buildingsData: adgBuildingsData } = generateADGData()

  return (
    <div className="w-full space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">
            🚀 Enhanced Performance Analytics Dashboard
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Comprehensive Standard vs Building Performance: All Metrics in Multiple-Line Charts
          </p>
          
          {/* Select Standard Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t">
            <label className="font-medium whitespace-nowrap text-gray-700">Select Standard:</label>
            <div className="flex gap-2 flex-1">
              <select 
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md flex-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {/* Built-in Standards */}
                <optgroup label="Built-in Standards">
                  <option value="HUBBARD">HUBBARD</option>
                  <option value="ROSS">ROSS</option>
                  <option value="COBB">COBB</option>
                  <option value="INDIAN RIVER">INDIAN RIVER</option>
                  <option value="ARBOR ACRES">ARBOR ACRES</option>
                </optgroup>
                {/* Custom Standards */}
                {customStandards.length > 0 && (
                  <optgroup label="Custom Standards">
                    {customStandards.map(cs => (
                      <option key={cs.name} value={cs.name}>{cs.name} (Custom)</option>
                    ))}
                  </optgroup>
                )}
              </select>
              {isCustomStandard && (
                <Button
                  variant="outline"
                  onClick={() => handleDeleteCustomStandard(selectedStandard)}
                  className="px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  title="Delete Custom Standard"
                >
                  🗑️
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleAddCustomStandard}
              className="whitespace-nowrap border-gray-300 hover:bg-gray-50"
            >
              Add Custom Standard {customStandards.length > 0 && `(${customStandards.length})`}
            </Button>
          </div>

          {/* Current Standard Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 mt-4">
            <h4 className="font-medium text-blue-800 mb-2">
              📊 Current Standard: {currentStandard.name} 
              {isCustomStandard && <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full ml-2">Custom</span>}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-red-700">Mortality</div>
                <div className="text-lg font-bold text-red-600">{currentStandard.mortality.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-700">FCR</div>
                <div className="text-lg font-bold text-blue-600">{currentStandard.fcr.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-700">Weight</div>
                <div className="text-lg font-bold text-green-600">{currentStandard.weight}g</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-orange-700">ADG</div>
                <div className="text-lg font-bold text-orange-600">{currentStandard.adg}g</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Chart Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* FCR Chart - Full Width */}
            <Card className="lg:col-span-2 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-700">Feed Conversion Ratio Performance</CardTitle>
                <p className="text-sm text-gray-600">FCR standard vs actual progression over 36 days</p>
              </CardHeader>
              <CardContent>
                <FCRChartRecharts data={standardFCRData} />
              </CardContent>
            </Card>

            {/* Mortality Rate Chart */}
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-red-700">Mortality Rate Comparison</CardTitle>
                <p className="text-sm text-gray-600">Standard vs actual mortality over time</p>
              </CardHeader>
              <CardContent>
                <MortalityChartRecharts data={standardMortalityData} />
              </CardContent>
            </Card>

            {/* Weight Growth Chart */}
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-700">Average Weight Growth</CardTitle>
                <p className="text-sm text-gray-600">Weight progression vs standard</p>
              </CardHeader>
              <CardContent>
                <WeightChartRecharts data={standardWeightData} />
              </CardContent>
            </Card>

            {/* ADG Chart */}
            <Card className="border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-700">Average Daily Gain</CardTitle>
                <p className="text-sm text-gray-600">ADG standard vs actual progression</p>
              </CardHeader>
              <CardContent>
                <ADGChartRecharts data={standardADGData} />
              </CardContent>
            </Card>

          </div>
          
          {/* Legend and Summary */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Building Performance Overview</h3>
            
            {/* Chart Legend */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-4 h-4 bg-red-500 rounded mx-auto mb-2"></div>
                <div className="text-sm font-medium text-red-700">Standard</div>
                <div className="text-xs text-red-600">Target Performance</div>
              </div>
              
              {buildingsConfig.map((building) => (
                <div 
                  key={building.id}
                  className="text-center p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: `${building.color}10`,
                    borderColor: `${building.color}40`
                  }}
                >
                  <div 
                    className="w-4 h-4 rounded mx-auto mb-2"
                    style={{ backgroundColor: building.color }}
                  ></div>
                  <div 
                    className="text-sm font-medium"
                    style={{ color: building.color }}
                  >
                    {building.shortCode}
                  </div>
                  <div className="text-xs text-gray-600">{building.name}</div>
                </div>
              ))}
            </div>

            {/* Performance Summary */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-lg border">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">📊 Performance Summary (Day 35) - {currentStandard.name} Standard</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Mortality */}
                <div className="bg-white p-4 rounded border border-red-200">
                  <h5 className="font-medium text-red-700 mb-2">Mortality Rate</h5>
                  <div className="text-sm space-y-1">
                    <div className="text-red-600 font-medium">Standard: {currentStandard.mortality.toFixed(1)}%</div>
                    {mortalityBuildingsData.map((building) => {
                      const final = building.data[building.data.length - 1].actual
                      const isGood = final <= currentStandard.mortality
                      return (
                        <div key={building.id} className="flex justify-between">
                          <span style={{ color: building.color }}>{building.shortCode}:</span>
                          <span className={isGood ? 'text-green-600' : 'text-red-600'}>
                            {final.toFixed(1)}% {isGood ? '✓' : '⚠'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* FCR */}
                <div className="bg-white p-4 rounded border border-blue-200">
                  <h5 className="font-medium text-blue-700 mb-2">Feed Conversion</h5>
                  <div className="text-sm space-y-1">
                    <div className="text-blue-600 font-medium">Standard: {currentStandard.fcr.toFixed(2)}</div>
                    {fcrBuildingsData.map((building) => {
                      const final = building.data[building.data.length - 1].actual
                      const isGood = final <= currentStandard.fcr
                      return (
                        <div key={building.id} className="flex justify-between">
                          <span style={{ color: building.color }}>{building.shortCode}:</span>
                          <span className={isGood ? 'text-green-600' : 'text-red-600'}>
                            {final.toFixed(2)} {isGood ? '✓' : '⚠'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Weight */}
                <div className="bg-white p-4 rounded border border-green-200">
                  <h5 className="font-medium text-green-700 mb-2">Average Weight</h5>
                  <div className="text-sm space-y-1">
                    <div className="text-green-600 font-medium">Standard: {currentStandard.weight}g</div>
                    {weightBuildingsData.map((building) => {
                      const final = building.data[building.data.length - 1].actual
                      const isGood = final >= (currentStandard.weight * 0.95) // Within 95% of standard
                      return (
                        <div key={building.id} className="flex justify-between">
                          <span style={{ color: building.color }}>{building.shortCode}:</span>
                          <span className={isGood ? 'text-green-600' : 'text-red-600'}>
                            {final}g {isGood ? '✓' : '⚠'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ADG */}
                <div className="bg-white p-4 rounded border border-orange-200">
                  <h5 className="font-medium text-orange-700 mb-2">Daily Gain</h5>
                  <div className="text-sm space-y-1">
                    <div className="text-orange-600 font-medium">Standard: {currentStandard.adg}g</div>
                    {adgBuildingsData.map((building) => {
                      const final = building.data[building.data.length - 1].actual
                      const isGood = final >= (currentStandard.adg * 0.90) // Within 90% of standard
                      return (
                        <div key={building.id} className="flex justify-between">
                          <span style={{ color: building.color }}>{building.shortCode}:</span>
                          <span className={isGood ? 'text-green-600' : 'text-red-600'}>
                            {final}g {isGood ? '✓' : '⚠'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Standard Modal */}
      {showCustomStandardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Create Custom Standard</h2>
            <p className="mb-4 text-gray-600 text-sm">
              Define your own performance benchmark standard for all charts. Leave fields empty to use default values.
            </p>
            
            <CustomStandardForm 
              onSave={handleSaveCustomStandard}
              onCancel={() => setShowCustomStandardModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Simple Custom Standard Form Component
function CustomStandardForm({ onSave, onCancel }: { onSave: (standard: any) => void, onCancel: () => void }) {
  const [name, setName] = useState("")
  const [mortality, setMortality] = useState("")
  const [fcr, setFcr] = useState("")
  const [weight, setWeight] = useState("")
  const [adg, setAdg] = useState("")

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      alert("Please enter a standard name")
      return
    }
    
    const mortalityVal = parseFloat(mortality)
    const fcrVal = parseFloat(fcr)
    const weightVal = parseInt(weight)
    const adgVal = parseInt(adg)
    
    // Validate ranges
    if (mortalityVal && (mortalityVal < 0 || mortalityVal > 20)) {
      alert("Mortality rate should be between 0% and 20%")
      return
    }
    
    if (fcrVal && (fcrVal < 1.0 || fcrVal > 3.0)) {
      alert("FCR should be between 1.0 and 3.0")
      return
    }
    
    if (weightVal && (weightVal < 500 || weightVal > 4000)) {
      alert("Weight should be between 500g and 4000g")
      return
    }
    
    if (adgVal && (adgVal < 20 || adgVal > 150)) {
      alert("ADG should be between 20g and 150g per day")
      return
    }

    const newStandard = {
      name: name.trim(),
      mortality: mortalityVal || 6.0,
      fcr: fcrVal || 1.8,
      weight: weightVal || 2000,
      adg: adgVal || 70,
    }

    onSave(newStandard)
    
    // Reset form
    setName("")
    setMortality("")
    setFcr("")
    setWeight("")
    setAdg("")
  }

  return (
    <div className="space-y-4">
      {/* Standard Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Standard Name *
        </label>
        <input 
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          placeholder="e.g., My Farm Standard" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Mortality Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Mortality Rate (%)
        </label>
        <input 
          type="number"
          step="0.1"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" 
          placeholder="6.0" 
          value={mortality} 
          onChange={(e) => setMortality(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Typical range: 4.0% - 8.0%</p>
      </div>

      {/* FCR */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Feed Conversion Ratio (FCR)
        </label>
        <input 
          type="number"
          step="0.01"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          placeholder="1.80" 
          value={fcr} 
          onChange={(e) => setFcr(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Typical range: 1.60 - 2.00</p>
      </div>

      {/* Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Final Weight (grams)
        </label>
        <input 
          type="number"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500" 
          placeholder="2000" 
          value={weight} 
          onChange={(e) => setWeight(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Typical range: 1800g - 2200g</p>
      </div>

      {/* ADG */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target Average Daily Gain (g/day)
        </label>
        <input 
          type="number"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
          placeholder="70" 
          value={adg} 
          onChange={(e) => setAdg(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">Typical range: 60g - 80g per day</p>
      </div>
      
      <div className="flex gap-3 mt-6">
        <Button 
          onClick={handleSave}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Save Standard
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex-1 border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
} 