"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { FarmData, DailyRecord } from "@/types/calculator"
import { TrendingUp, TrendingDown, Activity, Target, AlertTriangle, Stethoscope } from "lucide-react"
import { useState } from "react"

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

interface PerformanceDashboardProps {
  farmData: FarmData
  dailyRecords: DailyRecord[]
}

const BENCHMARK_STANDARDS: BenchmarkStandard[] = [
  { name: 'COBB', mortalityRate: 0.24, fcr: 1.45, avgDailyGain: 65 },
  { name: 'ROSS', mortalityRate: 0.28, fcr: 1.48, avgDailyGain: 63 },
  { name: 'HUBBARD', mortalityRate: 0.26, fcr: 1.46, avgDailyGain: 64 }
]

// Mock building data - replace with actual API call
const mockBuildingsData: BuildingData[] = [
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
]

export function PerformanceDashboard({ farmData, dailyRecords }: PerformanceDashboardProps) {
  const latestRecord = dailyRecords[dailyRecords.length - 1]

  // Calculate farm-wide aggregated metrics
  const calculateFarmMetrics = () => {
    const activeBuildings = mockBuildingsData.filter(b => b.status === 'active' && b.totalBirds > 0)
    
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

    const totalLiveBirds = activeBuildings.reduce((sum, b) => sum + b.liveBirds, 0)
    const totalBirds = activeBuildings.reduce((sum, b) => sum + b.totalBirds, 0)
    
    // Weighted average mortality rate
    const weightedMortality = activeBuildings.reduce((sum, b) => 
      sum + (b.mortalityRate * b.totalBirds), 0) / totalBirds
    
    // Weighted average FCR
    const buildingsWithFCR = activeBuildings.filter(b => b.fcr > 0)
    const avgFCR = buildingsWithFCR.length > 0 
      ? buildingsWithFCR.reduce((sum, b) => sum + b.fcr, 0) / buildingsWithFCR.length 
      : 0

    // Weighted average weight
    const buildingsWithWeight = activeBuildings.filter(b => b.avgWeight > 0)
    const avgWeight = buildingsWithWeight.length > 0
      ? buildingsWithWeight.reduce((sum, b) => sum + b.avgWeight, 0) / buildingsWithWeight.length
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

  const [selectedStandard, setSelectedStandard] = useState<BenchmarkStandard>(BENCHMARK_STANDARDS[0])
  const farmMetrics = calculateFarmMetrics()

  const getFarmPerformanceStatus = (actual: number, standard: number, lowerIsBetter: boolean = true) => {
    if (actual === 0) return { status: 'N/A', color: 'text-gray-500' }
    
    const difference = lowerIsBetter ? standard - actual : actual - standard
    const percentDiff = (difference / standard) * 100
    
    if (percentDiff > 5) return { status: 'Excellent', color: 'text-green-600' }
    if (percentDiff > 0) return { status: 'Above Standard', color: 'text-green-500' }
    if (percentDiff > -10) return { status: 'Below Target', color: 'text-red-600' }
    return { status: 'Below Target', color: 'text-red-600' }
  }

  const farmMortalityStatus = getFarmPerformanceStatus(farmMetrics.avgMortalityRate, selectedStandard.mortalityRate, true)
  const farmFcrStatus = getFarmPerformanceStatus(farmMetrics.avgFCR, selectedStandard.fcr, true)
  const farmWeightStatus = getFarmPerformanceStatus(farmMetrics.avgDailyGain, selectedStandard.avgDailyGain, false)

  if (!latestRecord) {
    return (
      <div className="space-y-6">
        {/* Farm-wide Performance Benchmark Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Performance Benchmark Standard</h1>
          <p className="text-gray-600 mb-6">Compare your farm performance against industry standards</p>

          {/* Standard Selection */}
          <div className="flex items-center gap-4 mb-6">
            <label className="font-medium">Select Standard</label>
            <select 
              value={selectedStandard.name}
              onChange={(e) => setSelectedStandard(BENCHMARK_STANDARDS.find(s => s.name === e.target.value) || BENCHMARK_STANDARDS[0])}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {BENCHMARK_STANDARDS.map(standard => (
                <option key={standard.name} value={standard.name}>{standard.name}</option>
              ))}
            </select>
            <Button variant="outline">Add Custom Standard</Button>
          </div>

          {/* Benchmark Comparison */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Benchmark Comparison</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
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
                 <span className={farmMortalityStatus.color}>{farmMortalityStatus.status}</span>
               </div>
            </div>
          </Card>

          {/* Performance Benchmarks Cards */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Performance Benchmarks</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mortality Rate */}
              <Card className={`p-6 text-center ${farmMetrics.avgMortalityRate <= selectedStandard.mortalityRate ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className={`text-4xl font-bold ${farmMetrics.avgMortalityRate <= selectedStandard.mortalityRate ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {farmMetrics.avgMortalityRate > 0 ? `${farmMetrics.avgMortalityRate.toFixed(2)}%` : '0%'}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">Mortality Rate</div>
                                 <div className={`font-medium ${farmMortalityStatus.color}`}>{farmMortalityStatus.status}</div>
              </Card>

              {/* FCR */}
              <Card className={`p-6 text-center ${farmMetrics.avgFCR > 0 && farmMetrics.avgFCR <= selectedStandard.fcr ? 'bg-green-50 dark:bg-green-900/20' : farmMetrics.avgFCR > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className={`text-4xl font-bold ${farmMetrics.avgFCR > 0 && farmMetrics.avgFCR <= selectedStandard.fcr ? 'text-green-600 dark:text-green-400' : farmMetrics.avgFCR > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {farmMetrics.avgFCR > 0 ? farmMetrics.avgFCR.toFixed(2) : '0'}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">Feed Conversion Ratio</div>
                                 <div className={`font-medium ${farmFcrStatus.color}`}>{farmFcrStatus.status}</div>
              </Card>

              {/* Average Daily Gain */}
              <Card className={`p-6 text-center ${farmMetrics.avgDailyGain >= selectedStandard.avgDailyGain ? 'bg-green-50 dark:bg-green-900/20' : farmMetrics.avgDailyGain > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <div className={`text-4xl font-bold ${farmMetrics.avgDailyGain >= selectedStandard.avgDailyGain ? 'text-green-600 dark:text-green-400' : farmMetrics.avgDailyGain > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {farmMetrics.avgDailyGain > 0 ? `${farmMetrics.avgDailyGain.toFixed(0)}g` : '0g'}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">Average Daily Gain</div>
                                 <div className={`font-medium ${farmWeightStatus.color}`}>{farmWeightStatus.status}</div>
              </Card>
            </div>
          </div>



          {/* Building Performance Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Building Performance Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockBuildingsData.map((building, index) => (
                <Card key={building.id} className="border">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{building.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                    <CardDescription>
                      Status: {building.status} • Start Date: {building.startDate}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded text-center ${building.liveBirds > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <div className="text-sm text-gray-600 dark:text-gray-400">LIVE BIRDS</div>
                        <div className={`text-lg font-bold ${building.liveBirds > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {building.liveBirds > 0 ? building.liveBirds.toLocaleString() : 'N/A'}
                        </div>
                      </div>
                      <div className={`p-3 rounded text-center ${building.mortalityRate > 0 ? (building.mortalityRate > 5 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20') : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <div className="text-sm text-gray-600 dark:text-gray-400">MORTALITY RATE</div>
                        <div className={`text-lg font-bold ${building.mortalityRate > 0 ? (building.mortalityRate > 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400') : 'text-gray-500 dark:text-gray-400'}`}>
                          {building.mortalityRate > 0 ? building.mortalityRate.toFixed(2) : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-3 rounded text-center ${building.fcr > 0 ? (building.fcr > 2 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20') : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <div className="text-sm text-gray-600 dark:text-gray-400">FCR</div>
                        <div className={`text-lg font-bold ${building.fcr > 0 ? (building.fcr > 2 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400') : 'text-gray-500 dark:text-gray-400'}`}>
                          {building.fcr > 0 ? building.fcr : 'N/A'}
                        </div>
                      </div>
                      <div className={`p-3 rounded text-center ${building.avgWeight > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <div className="text-sm text-gray-600 dark:text-gray-400">AVG WEIGHT</div>
                        <div className={`text-lg font-bold ${building.avgWeight > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {building.avgWeight > 0 ? building.avgWeight : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance Dashboard</CardTitle>
            <CardDescription>Add daily records to view performance analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="font-medium">No data available yet</p>
              <p className="text-sm">Start adding daily records to see performance metrics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate key metrics
  const currentAge = latestRecord.age
  const currentWeight = latestRecord.alw
  const mortalityRate = latestRecord.mortalityPercent
  const averageDailyGain = latestRecord.adg
  const totalFeedConsumed = latestRecord.cumulativeFeeds
  const remainingBirds = latestRecord.endingHeads

  // Calculate FCR (Feed Conversion Ratio)
  const totalWeightGained = (remainingBirds * (currentWeight - farmData.initialGrams)) / 1000 // kg
  const fcr = totalWeightGained > 0 ? totalFeedConsumed / totalWeightGained : 0

  // Performance benchmarks and targets
  const benchmarks = {
    fcr: { optimal: 1.6, good: 1.8, target: 2.0 },
    mortality: { optimal: 3, good: 5, target: 8 },
    adg: { optimal: 60, good: 50, target: 40 },
    weight: getTargetWeight(currentAge),
  }

  function getTargetWeight(age: number): { optimal: number; good: number; target: number } {
    // Standard broiler weight targets by age
    const baseWeight = farmData.initialGrams
    const dailyGain = 50 // optimal daily gain
    const optimal = baseWeight + age * dailyGain
    return {
      optimal: optimal,
      good: optimal * 0.9,
      target: optimal * 0.8,
    }
  }

  // Performance status functions
  function getPerformanceStatus(value: number, benchmark: any, reverse = false) {
    if (reverse) {
      // For mortality (lower is better)
      if (value <= benchmark.optimal) return { status: "excellent", color: "text-green-600", bg: "bg-green-50" }
      if (value <= benchmark.good) return { status: "good", color: "text-blue-600", bg: "bg-blue-50" }
      if (value <= benchmark.target) return { status: "acceptable", color: "text-yellow-600", bg: "bg-yellow-50" }
      return { status: "poor", color: "text-red-600", bg: "bg-red-50" }
    } else {
      // For FCR, ADG, Weight (higher is better for ADG/Weight, lower for FCR)
      if (value >= benchmark.optimal) return { status: "excellent", color: "text-green-600", bg: "bg-green-50" }
      if (value >= benchmark.good) return { status: "good", color: "text-blue-600", bg: "bg-blue-50" }
      if (value >= benchmark.target) return { status: "acceptable", color: "text-yellow-600", bg: "bg-yellow-50" }
      return { status: "poor", color: "text-red-600", bg: "bg-red-50" }
    }
  }

  function getFCRStatus(fcr: number) {
    if (fcr <= benchmarks.fcr.optimal) return { status: "excellent", color: "text-green-600", bg: "bg-green-50" }
    if (fcr <= benchmarks.fcr.good) return { status: "good", color: "text-blue-600", bg: "bg-blue-50" }
    if (fcr <= benchmarks.fcr.target) return { status: "acceptable", color: "text-yellow-600", bg: "bg-yellow-50" }
    return { status: "poor", color: "text-red-600", bg: "bg-red-50" }
  }

  const mortalityStatus = getPerformanceStatus(mortalityRate, benchmarks.mortality, true)
  const adgStatus = getPerformanceStatus(averageDailyGain, benchmarks.adg)
  const weightStatus = getPerformanceStatus(currentWeight, benchmarks.weight)
  const fcrStatus = getFCRStatus(fcr)

  // Check if veterinarian consultation is needed
  const needsVetConsultation =
    mortalityStatus.status === "poor" ||
    adgStatus.status === "poor" ||
    weightStatus.status === "poor" ||
    fcrStatus.status === "poor"

  return (
    <div className="space-y-6">
      {/* Veterinarian Alert */}
      {needsVetConsultation && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Stethoscope className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-red-800 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Veterinarian Consultation Recommended
                </h4>
                <p className="text-red-700 text-sm mt-1">
                  One or more performance metrics are below target levels. Please consult your veterinarian
                  to assess flock health and implement corrective measures.
                </p>
                <div className="mt-2 text-xs text-red-600">
                  Issues detected: {[
                    mortalityStatus.status === "poor" && "High mortality rate",
                    adgStatus.status === "poor" && "Poor growth rate",
                    weightStatus.status === "poor" && "Low body weight",
                    fcrStatus.status === "poor" && "Poor feed conversion",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Live Birds */}
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{remainingBirds.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Live Birds</div>
            <div className="text-xs text-gray-500 mt-1">Day {currentAge} of cycle</div>
          </CardContent>
        </Card>

        {/* Mortality Rate */}
        <Card className={mortalityStatus.bg}>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${mortalityStatus.color}`}>{mortalityRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Mortality Rate</div>
            <div className={`text-xs ${mortalityStatus.color} font-medium mt-1 capitalize`}>
              {mortalityStatus.status}
              {mortalityStatus.status === "poor" && " - Consult Vet"}
            </div>
          </CardContent>
        </Card>

        {/* Feed Conversion Ratio */}
        <Card className={fcrStatus.bg}>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${fcrStatus.color}`}>{fcr.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Feed Conversion Ratio</div>
            <div className={`text-xs ${fcrStatus.color} font-medium mt-1 capitalize`}>
              {fcrStatus.status}
              {fcrStatus.status === "poor" && " - Consult Vet"}
            </div>
          </CardContent>
        </Card>

        {/* Average Weight */}
        <Card className={weightStatus.bg}>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${weightStatus.color}`}>{currentWeight.toFixed(0)}g</div>
            <div className="text-sm text-gray-600">Average Weight</div>
            <div className={`text-xs ${weightStatus.color} font-medium mt-1 capitalize`}>
              {weightStatus.status}
              {weightStatus.status === "poor" && " - Consult Vet"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Benchmarks</CardTitle>
          <CardDescription>Current performance vs industry standards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Average Daily Gain */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Daily Gain</span>
                <span className={`text-sm font-semibold ${adgStatus.color}`}>
                  {averageDailyGain.toFixed(1)}g/day ({adgStatus.status})
                  {adgStatus.status === "poor" && " - Consult Veterinarian"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    adgStatus.status === "excellent"
                      ? "bg-green-500"
                      : adgStatus.status === "good"
                      ? "bg-blue-500"
                      : adgStatus.status === "acceptable"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min((averageDailyGain / benchmarks.adg.optimal) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Target: {benchmarks.adg.target}g</span>
                <span>Optimal: {benchmarks.adg.optimal}g</span>
              </div>
            </div>

            {/* Mortality Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Mortality Rate</span>
                <span className={`text-sm font-semibold ${mortalityStatus.color}`}>
                  {mortalityRate.toFixed(1)}% ({mortalityStatus.status})
                  {mortalityStatus.status === "poor" && " - Consult Veterinarian"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    mortalityStatus.status === "excellent"
                      ? "bg-green-500"
                      : mortalityStatus.status === "good"
                      ? "bg-blue-500"
                      : mortalityStatus.status === "acceptable"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min((mortalityRate / benchmarks.mortality.target) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Optimal: ≤{benchmarks.mortality.optimal}%</span>
                <span>Target: ≤{benchmarks.mortality.target}%</span>
              </div>
            </div>

            {/* Feed Conversion Ratio */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Feed Conversion Ratio</span>
                <span className={`text-sm font-semibold ${fcrStatus.color}`}>
                  {fcr.toFixed(2)} ({fcrStatus.status})
                  {fcrStatus.status === "poor" && " - Consult Veterinarian"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    fcrStatus.status === "excellent"
                      ? "bg-green-500"
                      : fcrStatus.status === "good"
                      ? "bg-blue-500"
                      : fcrStatus.status === "acceptable"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.max(100 - (fcr / benchmarks.fcr.target) * 50, 20)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Optimal: ≤{benchmarks.fcr.optimal}</span>
                <span>Target: ≤{benchmarks.fcr.target}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Performance History</CardTitle>
          <CardDescription>Last 7 days of tracking data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dailyRecords.slice(-7).map((record, index) => {
              const dayMortalityRate = record.mortalityPercent
              const dayStatus =
                dayMortalityRate > benchmarks.mortality.target
                  ? "⚠️"
                  : record.adg < benchmarks.adg.target
                  ? "📉"
                  : "✅"

              return (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex flex-col space-y-3">
                    {/* Header row - Date, Age, Status */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold text-lg">{record.date}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Day {record.age}</span>
                      </div>
                      <span className="text-2xl">{dayStatus}</span>
                    </div>
                    
                    {/* Performance metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-white rounded border">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase">Weight</p>
                        <p className="font-semibold">{record.alw.toFixed(1)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase">ADG</p>
                        <p className="font-semibold text-green-600">+{record.adg.toFixed(1)}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase">Feed</p>
                        <p className="font-semibold">{record.dailyFeeds}kg</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase">Mortality</p>
                        <p className="font-semibold text-red-600">{record.dailyMortality}</p>
                      </div>
                    </div>
                    
                    {/* Additional info */}
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="text-xs text-gray-500 uppercase">Live Birds</p>
                      <p className="font-semibold text-green-600">{record.endingHeads.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
