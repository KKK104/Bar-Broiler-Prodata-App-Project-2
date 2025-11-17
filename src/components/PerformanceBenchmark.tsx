'use client'

import { useState, useMemo, useEffect } from 'react'
import { MortalityChart } from './charts/MortalityChart'
import { FCRChart } from './charts/FCRChart'
import { WeightChart } from './charts/WeightChart'
import { ADGChart } from './charts/ADGChart'
import { useBuildings, Building } from '@/hooks/useDatabase'

interface BuildingData {
  id: string
  name: string
  status: string
  startDate: string
  liveBirds: number | null
  mortalityRate: number | null
  fcr: number | null
  avgWeight: number | null
}

export default function PerformanceBenchmark({ farmId = "default-farm-id" }: { farmId?: string }) {
  const [selectedStandard, setSelectedStandard] = useState('HUBBARD')
  const [showCustomStandardModal, setShowCustomStandardModal] = useState(false);
  const [customStandard, setCustomStandard] = useState({
    name: '',
    mortality: '',
    fcr: '',
    weight: '',
    adg: ''
  });
  const [customStandards, setCustomStandards] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  
  const { buildings: dbBuildings, loading } = useBuildings(farmId);

  // Convert database buildings to component format
  useEffect(() => {
    if (!loading && dbBuildings.length > 0) {
      const convertedBuildings: BuildingData[] = dbBuildings.map((building: Building, index: number) => ({
        id: building.id,
        name: building.name,
        status: building.status,
        startDate: building.cycle_start_date || '7/16/2025',
        liveBirds: 30000 + (index * 5000), // Mock performance data - replace with actual from daily_records
        mortalityRate: 0.5 + (index * 0.1), // Mock performance data
        fcr: 1.5 + (index * 0.2), // Mock performance data
        avgWeight: 2000 + (index * 100) // Mock performance data
      }));
      setBuildings(convertedBuildings);
    } else if (!loading) {
      setBuildings([]);
    }
  }, [dbBuildings, loading]);

  // Legacy hardcoded data for fallback (will be empty when real buildings load)
  const fallbackBuildings: BuildingData[] = buildings.length > 0 ? [] : [
    {
      id: 'b3',
      name: 'b3',
      status: 'active',
      startDate: '7/16/2025',
      liveBirds: null,
      mortalityRate: null,
      fcr: null,
      avgWeight: null
    },
    {
      id: 'B2',
      name: 'B2', 
      status: 'active',
      startDate: '7/16/2025',
      liveBirds: 500,
      mortalityRate: 10,
      fcr: 5,
      avgWeight: 1200
    },
    {
      id: 'B1',
      name: 'B1',
      status: 'active', 
      startDate: '7/16/2025',
      liveBirds: 36327,
      mortalityRate: 0.54,
      fcr: 0,
      avgWeight: 0
    }
  ]

  const aggregatedMetrics = useMemo(() => {
    const validBuildings = buildings.filter(b => 
      b.liveBirds !== null && b.mortalityRate !== null
    )

    if (validBuildings.length === 0) {
      return {
        totalLiveBirds: 0,
        avgMortalityRate: 0,
        avgFCR: 0,
        avgWeight: 0
      }
    }

    const totalLiveBirds = validBuildings.reduce((sum, b) => sum + (b.liveBirds || 0), 0)
    
    const weightedMortality = validBuildings.reduce((sum, b) => {
      return sum + ((b.mortalityRate || 0) * (b.liveBirds || 0))
    }, 0)
    const avgMortalityRate = totalLiveBirds > 0 ? weightedMortality / totalLiveBirds : 0

    const validFCRBuildings = validBuildings.filter(b => b.fcr && b.fcr > 0)
    const avgFCR = validFCRBuildings.length > 0 
      ? validFCRBuildings.reduce((sum, b) => sum + (b.fcr || 0), 0) / validFCRBuildings.length
      : 0

    const weightedWeight = validBuildings.reduce((sum, b) => {
      return sum + ((b.avgWeight || 0) * (b.liveBirds || 0))
    }, 0)
    const avgWeight = totalLiveBirds > 0 ? weightedWeight / totalLiveBirds : 0

    return {
      totalLiveBirds,
      avgMortalityRate: Number(avgMortalityRate.toFixed(2)),
      avgFCR: Number(avgFCR.toFixed(2)),
      avgWeight: Number(avgWeight.toFixed(0))
    }
  }, [buildings])

  const standards = {
    HUBBARD: { mortality: 0.24, fcr: 1.75, weight: 2100 },
    ROSS: { mortality: 0.22, fcr: 1.65, weight: 2000 },
    COBB: { mortality: 0.20, fcr: 1.60, weight: 1950 },
    'INDIAN RIVER': { mortality: 0.25, fcr: 1.70, weight: 2050 },
    'ARBOR ACRES': { mortality: 0.23, fcr: 1.68, weight: 2080 },
    ...Object.fromEntries(customStandards.map(cs => [cs.name, { mortality: Number(cs.mortality), fcr: Number(cs.fcr), weight: Number(cs.weight), adg: Number(cs.adg) }]))
  }

  const currentStandard = standards[selectedStandard as keyof typeof standards]
  const mortalityDifference = aggregatedMetrics.avgMortalityRate - currentStandard.mortality
  const mortalityPerformance = mortalityDifference <= 0 ? 'Above Standard' : 'Below Standard'
  const dailyGain = aggregatedMetrics.avgWeight > 0 ? Math.round(aggregatedMetrics.avgWeight / 35) : 0

  const mortalityData = [
    { day: 7, standard: currentStandard.mortality * 0.6, actual: aggregatedMetrics.avgMortalityRate * 0.6 },
    { day: 14, standard: currentStandard.mortality * 0.75, actual: aggregatedMetrics.avgMortalityRate * 0.75 },
    { day: 21, standard: currentStandard.mortality * 0.9, actual: aggregatedMetrics.avgMortalityRate * 0.9 },
    { day: 28, standard: currentStandard.mortality, actual: aggregatedMetrics.avgMortalityRate }
  ]

  const fcrData = [
    { day: 7, standard: currentStandard.fcr * 0.7, actual: aggregatedMetrics.avgFCR * 0.7 },
    { day: 14, standard: currentStandard.fcr * 0.8, actual: aggregatedMetrics.avgFCR * 0.8 },
    { day: 21, standard: currentStandard.fcr * 0.9, actual: aggregatedMetrics.avgFCR * 0.9 },
    { day: 28, standard: currentStandard.fcr, actual: aggregatedMetrics.avgFCR }
  ]

  const weightData = [
    { day: 7, standard: currentStandard.weight * 0.1, actual: aggregatedMetrics.avgWeight * 0.1 },
    { day: 14, standard: currentStandard.weight * 0.3, actual: aggregatedMetrics.avgWeight * 0.3 },
    { day: 21, standard: currentStandard.weight * 0.6, actual: aggregatedMetrics.avgWeight * 0.6 },
    { day: 28, standard: currentStandard.weight, actual: aggregatedMetrics.avgWeight }
  ]

  const adgData = [
    { day: 7, standard: currentStandard.weight ? Math.round(currentStandard.weight / 35) : 0, actual: dailyGain },
    { day: 14, standard: currentStandard.weight ? Math.round(currentStandard.weight / 35) : 0, actual: dailyGain },
    { day: 21, standard: currentStandard.weight ? Math.round(currentStandard.weight / 35) : 0, actual: dailyGain },
    { day: 28, standard: currentStandard.weight ? Math.round(currentStandard.weight / 35) : 0, actual: dailyGain },
  ];

  return (
    <div className="space-y-6">
      {/* Clean interface - informational boxes removed */}
      {showCustomStandardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowCustomStandardModal(false)}
            >
              Close
            </button>
            <h3 className="text-lg font-semibold mb-4">Add Custom Standard</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                setCustomStandards(prev => [...prev, customStandard]);
                setShowCustomStandardModal(false);
                setCustomStandard({ name: '', mortality: '', fcr: '', weight: '', adg: '' });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  value={customStandard.name}
                  onChange={e => setCustomStandard(cs => ({ ...cs, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mortality Rate (%)</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  type="number"
                  step="0.01"
                  value={customStandard.mortality}
                  onChange={e => setCustomStandard(cs => ({ ...cs, mortality: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">FCR</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  type="number"
                  step="0.01"
                  value={customStandard.fcr}
                  onChange={e => setCustomStandard(cs => ({ ...cs, fcr: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (g)</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  type="number"
                  value={customStandard.weight}
                  onChange={e => setCustomStandard(cs => ({ ...cs, weight: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ADG</label>
                <input
                  className="w-full border rounded px-2 py-1"
                  type="number"
                  value={customStandard.adg}
                  onChange={e => setCustomStandard(cs => ({ ...cs, adg: e.target.value }))}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded mt-2 hover:bg-blue-700"
              >
                Add Standard
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}