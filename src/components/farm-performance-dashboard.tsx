'use client'

import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { MortalityChart } from './charts/MortalityChart'
import { FCRChart } from './charts/FCRChart'
import { WeightChart } from './charts/WeightChart'
import { useBuildings, Building } from '@/hooks/useDatabase'

interface BuildingData {
  id: string
  name: string
  status: string
  startDate: string
  liveBirds: number
  mortalityRate: number
  fcr: number
  avgWeight: number
  totalBirds: number
}

interface BenchmarkStandard {
  name: string
  mortalityRate: number
  fcr: number
  avgDailyGain: number
}

const BENCHMARK_STANDARDS: BenchmarkStandard[] = [
  { name: 'COBB', mortalityRate: 0.24, fcr: 1.45, avgDailyGain: 65 },
  { name: 'ROSS', mortalityRate: 0.28, fcr: 1.48, avgDailyGain: 63 },
  { name: 'HUBBARD', mortalityRate: 0.26, fcr: 1.46, avgDailyGain: 64 }
]

export default function FarmPerformanceDashboard({ farmId = "default-farm-id" }: { farmId?: string }) {
  const [buildingsData, setBuildingsData] = useState<BuildingData[]>([])
  const [selectedStandard, setSelectedStandard] = useState<BenchmarkStandard>(BENCHMARK_STANDARDS[0])
  const [loading, setLoading] = useState(true)
  
  const { buildings: dbBuildings, loading: buildingsLoading } = useBuildings(farmId);

  // Convert database buildings to component format
  useEffect(() => {
    if (!buildingsLoading && dbBuildings.length > 0) {
      const convertedBuildings: BuildingData[] = dbBuildings.map((building: Building, index: number) => ({
        id: building.id,
        name: building.name,
        status: building.status,
        startDate: building.cycle_start_date || '7/16/2025',
        liveBirds: 30000 + (index * 5000), // Mock data - replace with actual from daily_records
        mortalityRate: 0.5 + (index * 0.1), // Mock data
        fcr: 1.5 + (index * 0.2), // Mock data
        avgWeight: 2000 + (index * 100), // Mock data
        totalBirds: 30500 + (index * 5000) // Mock data
      }));
      setBuildingsData(convertedBuildings);
      setLoading(false);
    } else if (!buildingsLoading) {
      setBuildingsData([]);
      setLoading(false);
    }
  }, [dbBuildings, buildingsLoading]);

  // Legacy mock data for fallback (will be replaced by real data)
  useEffect(() => {
    const fallbackData: BuildingData[] = buildingsData.length > 0 ? [] : [
      {
        id: 'B1',
        name: 'B1',
        status: 'active',
        startDate: '7/16/2025',
        liveBirds: 36327,
        mortalityRate: 0.54,
        fcr: 0,
        avgWeight: 0,
        totalBirds: 36500
      },
      {
        id: 'B2', 
        name: 'B2',
        status: 'active',
        startDate: '7/16/2025',
        liveBirds: 500,
        mortalityRate: 10,
        fcr: 5,
        avgWeight: 1200,
        totalBirds: 1000
      },
      {
        id: 'B3',
        name: 'B3', 
        status: 'active',
        startDate: '7/16/2025',
        liveBirds: 0,
        mortalityRate: 0,
        fcr: 0,
        avgWeight: 0,
        totalBirds: 0
      }
    ];
    if (buildingsData.length === 0) {
      setBuildingsData(fallbackData);
    }
    setLoading(false);
  }, [buildingsData.length])

  // Calculate farm-wide aggregated metrics
  const calculateFarmMetrics = (): {
    totalLiveBirds: number
    totalBirds: number
    avgMortalityRate: number
    avgFCR: number
    avgWeight: number
    avgDailyGain: number
  } => {
    const activeBuildings = buildingsData.filter((b: BuildingData) => b.status === 'active' && b.totalBirds > 0)
    
    if (activeBuildings.length === 0) {
      return {
        totalLiveBirds: 0,
        totalBirds: 0,
        avgMortalityRate: 0,
        avgFCR: 0,
        avgWeight: 0,
        avgDailyGain: 0
      }
    }

    const totalLiveBirds = activeBuildings.reduce((sum: number, b: BuildingData) => sum + b.liveBirds, 0)
    const totalBirds = activeBuildings.reduce((sum: number, b: BuildingData) => sum + b.totalBirds, 0)
    
    // Weighted average mortality rate
    const weightedMortality = activeBuildings.reduce((sum: number, b: BuildingData) => 
      sum + (b.mortalityRate * b.totalBirds), 0) / totalBirds
    
    // Weighted average FCR
    const buildingsWithFCR = activeBuildings.filter((b: BuildingData) => b.fcr > 0)
    const avgFCR = buildingsWithFCR.length > 0 
      ? buildingsWithFCR.reduce((sum: number, b: BuildingData) => sum + b.fcr, 0) / buildingsWithFCR.length 
      : 0

    // Weighted average weight
    const buildingsWithWeight = activeBuildings.filter((b: BuildingData) => b.avgWeight > 0)
    const avgWeight = buildingsWithWeight.length > 0
      ? buildingsWithWeight.reduce((sum: number, b: BuildingData) => sum + b.avgWeight, 0) / buildingsWithWeight.length
      : 0

    return {
      totalLiveBirds,
      totalBirds,
      avgMortalityRate: weightedMortality,
      avgFCR,
      avgWeight,
      avgDailyGain: avgWeight > 0 ? avgWeight / 35 : 0 // Assuming 35 day cycle
    }
  }

  const farmMetrics = calculateFarmMetrics()

  const getPerformanceStatus = (actual: number, standard: number, lowerIsBetter: boolean = true) => {
    if (actual === 0) return { status: 'N/A', color: 'text-gray-500' }
    
    const difference = lowerIsBetter ? standard - actual : actual - standard
    const percentDiff = (difference / standard) * 100
    
    if (percentDiff > 5) return { status: 'Excellent', color: 'text-green-600' }
    if (percentDiff > 0) return { status: 'Above Standard', color: 'text-green-500' }
    if (percentDiff > -10) return { status: 'Below Standard', color: 'text-yellow-600' }
    return { status: 'Poor', color: 'text-red-600' }
  }

  const mortalityStatus = getPerformanceStatus(farmMetrics.avgMortalityRate, selectedStandard.mortalityRate, true)
  const fcrStatus = getPerformanceStatus(farmMetrics.avgFCR, selectedStandard.fcr, true)
  const weightStatus = getPerformanceStatus(farmMetrics.avgDailyGain, selectedStandard.avgDailyGain, false)

  if (loading) {
    return <div className="p-4 sm:p-6 text-sm sm:text-base">Loading farm performance data...</div>
  }

  const mortalityData = [
    { day: 1, standard: 0.1, actual: 0 },
    { day: 7, standard: 0.15, actual: 0 },
    { day: 14, standard: 0.18, actual: 0 },
    { day: 21, standard: 0.22, actual: 0 }
  ]

  const fcrData = [
    { day: 0, standard: 0.0, actual: 0.0 },
    { day: 1, standard: 0.1, actual: 0.1 },
    { day: 2, standard: 0.25, actual: 0.2 },
    { day: 3, standard: 0.4, actual: 0.2 },
    { day: 4, standard: 0.5, actual: 0.3 },
    { day: 5, standard: 0.6, actual: 0.4 },
    { day: 6, standard: 0.7, actual: 0.1 },
    { day: 7, standard: 0.8, actual: 0.6 },
    { day: 8, standard: 0.85, actual: 0.4 },
    { day: 9, standard: 0.9, actual: 0.5 },
    { day: 10, standard: 0.95, actual: 0.5 },
    { day: 11, standard: 0.98, actual: 0.0 },
    { day: 12, standard: 1.0, actual: 0.0 },
    { day: 14, standard: 1.05, actual: 0.0 },
    { day: 21, standard: 1.22, actual: 0.0 },
    { day: 28, standard: 1.38, actual: 0.0 },
    { day: 35, standard: 1.46, actual: 0.0 },
    { day: 36, standard: 1.47, actual: 0.0 }
  ]

  const weightData = [
    { day: 1, standard: 45, actual: 0 },
    { day: 7, standard: 180, actual: 0 },
    { day: 14, standard: 450, actual: 0 },
    { day: 21, standard: 850, actual: 0 }
  ]

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Performance Benchmark Standard</h1>
        <p className="text-sm sm:text-base text-gray-600">Compare your farm performance against industry standards</p>
      </div>

      {/* Standard Selection */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
          <label className="font-medium text-sm sm:text-base">Select Standard</label>
          <select 
            value={selectedStandard.name}
            onChange={(e) => setSelectedStandard(BENCHMARK_STANDARDS.find(s => s.name === e.target.value) || BENCHMARK_STANDARDS[0])}
            className="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-auto text-sm sm:text-base"
          >
            {BENCHMARK_STANDARDS.map(standard => (
              <option key={standard.name} value={standard.name}>{standard.name}</option>
            ))}
          </select>
        </div>
        <Button 
          variant="outline" 
          className="px-3 py-1.5 text-xs sm:text-sm w-full sm:w-auto sm:px-4 sm:py-2"
        >
          Add
        </Button>
      </div>

      {/* Benchmark Comparison */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Benchmark Comparison</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <span className="font-medium">Standard Mortality:</span> {selectedStandard.mortalityRate}%
          </div>
          <div>
            <span className="font-medium">Actual Mortality:</span> {farmMetrics.avgMortalityRate.toFixed(2)}%
          </div>
          <div>
            <span className="font-medium">Difference:</span> 
            <span className={farmMetrics.avgMortalityRate < selectedStandard.mortalityRate ? 'text-green-600' : 'text-red-600'}>
              {farmMetrics.avgMortalityRate > 0 ? (selectedStandard.mortalityRate - farmMetrics.avgMortalityRate).toFixed(2) : 'N/A'}%
            </span>
          </div>
          <div>
            <span className="font-medium">Performance:</span> 
            <span className={mortalityStatus.color}>{mortalityStatus.status}</span>
          </div>
        </div>
      </Card>

      {/* Performance Benchmarks Cards */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Performance Benchmarks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Mortality Rate */}
          <Card className={`p-4 sm:p-6 text-center ${farmMetrics.avgMortalityRate <= selectedStandard.mortalityRate ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <div className={`text-2xl sm:text-4xl font-bold ${farmMetrics.avgMortalityRate <= selectedStandard.mortalityRate ? 'text-green-600' : 'text-red-600'}`}>
              {farmMetrics.avgMortalityRate > 0 ? `${farmMetrics.avgMortalityRate.toFixed(2)}%` : '0%'}
            </div>
            <div className="text-sm sm:text-base text-gray-600 mt-2">Mortality Rate</div>
            <div className={`font-medium text-sm sm:text-base ${mortalityStatus.color}`}>{mortalityStatus.status}</div>
          </Card>

          {/* FCR */}
          <Card className={`p-4 sm:p-6 text-center ${farmMetrics.avgFCR > 0 && farmMetrics.avgFCR <= selectedStandard.fcr ? 'bg-green-50 dark:bg-green-900/20' : farmMetrics.avgFCR > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <div className={`text-2xl sm:text-4xl font-bold ${farmMetrics.avgFCR > 0 && farmMetrics.avgFCR <= selectedStandard.fcr ? 'text-green-600' : farmMetrics.avgFCR > 0 ? 'text-red-600' : 'text-gray-500'}`}>
              {farmMetrics.avgFCR > 0 ? farmMetrics.avgFCR.toFixed(2) : '0'}
            </div>
            <div className="text-sm sm:text-base text-gray-600 mt-2">Feed Conversion Ratio</div>
            <div className={`font-medium text-sm sm:text-base ${fcrStatus.color}`}>{fcrStatus.status}</div>
          </Card>

          {/* Average Daily Gain */}
          <Card className={`p-4 sm:p-6 text-center ${farmMetrics.avgDailyGain >= selectedStandard.avgDailyGain ? 'bg-green-50 dark:bg-green-900/20' : farmMetrics.avgDailyGain > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <div className={`text-2xl sm:text-4xl font-bold ${farmMetrics.avgDailyGain >= selectedStandard.avgDailyGain ? 'text-green-600' : farmMetrics.avgDailyGain > 0 ? 'text-red-600' : 'text-gray-500'}`}>
              {farmMetrics.avgDailyGain > 0 ? `${farmMetrics.avgDailyGain.toFixed(0)}g` : '0g'}
            </div>
            <div className="text-sm sm:text-base text-gray-600 mt-2">Average Daily Gain</div>
            <div className={`font-medium text-sm sm:text-base ${weightStatus.color}`}>{weightStatus.status}</div>
          </Card>
        </div>
      </div>
    </div>
  )
}
