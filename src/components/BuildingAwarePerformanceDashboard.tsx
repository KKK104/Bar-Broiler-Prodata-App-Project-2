'use client'

import { useState, useEffect } from 'react'
import { useDailyRecords, BuildingPerformanceData as BuildingData } from '@/hooks/useDailyRecords'
import { BuildingPerformanceLineChartRecharts } from './charts/BuildingPerformanceLineChartRecharts'
import { BuildingPerformanceLineChartLargeRecharts } from './charts/BuildingPerformanceLineChartLargeRecharts'
import { SimpleClickableChart } from './charts/SimpleClickableChart'
import { StandardSelector } from './StandardSelector'
import { PerformanceStandard } from '@/hooks/usePerformanceStandards'

interface PerformanceMetrics {
  adg: { title: string; yAxisLabel: string; yAxisUnit: string }
  fcr: { title: string; yAxisLabel: string; yAxisUnit: string }
  weight: { title: string; yAxisLabel: string; yAxisUnit: string }
  mortality: { title: string; yAxisLabel: string; yAxisUnit: string }
}

const METRICS: PerformanceMetrics = {
  adg: { title: 'Average Daily Gain', yAxisLabel: 'Daily Gain', yAxisUnit: 'g/day' },
  fcr: { title: 'Feed Conversion Ratio', yAxisLabel: 'FCR', yAxisUnit: '' },
  weight: { title: 'Average Weight Growth', yAxisLabel: 'Weight', yAxisUnit: 'g' },
  mortality: { title: 'Mortality Rate Comparison', yAxisLabel: 'Mortality Rate', yAxisUnit: '%' }
}

export function BuildingAwarePerformanceDashboard({ farmId }: { farmId: string }) {
  const { buildingPerformance, loading, error } = useDailyRecords(farmId)
  const [selectedStandard, setSelectedStandard] = useState<PerformanceStandard | null>(null)

  const getStandardData = (metricType: keyof PerformanceMetrics) => {
    if (!selectedStandard) {
      // Default to Ross standard if none selected
      const defaultStandard = {
        mortality_rate: 5.8,
        fcr: 1.8,
        avg_weight: 2000,
        adg: 70
      }
      const data = []
      for (let day = 0; day <= 35; day++) {
        let performance = 0
        switch (metricType) {
                  case 'adg':
          // Progressive ADG that increases over time (starts low, builds up)
          performance = Math.max(0, defaultStandard.adg * 0.3 + (day * defaultStandard.adg * 0.02))
          break
        case 'fcr':
          // Progressive FCR that matches Excel data exactly: starts at 0 and follows Excel curve
          if (day === 0) {
            performance = 0
          } else if (day <= 7) {
            performance = 0 + (day * 0.90 / 7) // 0 to 0.90 in first 7 days
          } else if (day <= 14) {
            performance = 0.90 + ((day - 7) * 0.19 / 7) // 0.90 to 1.09 in next 7 days
          } else if (day <= 21) {
            performance = 1.09 + ((day - 14) * 0.21 / 7) // 1.09 to 1.30 in next 7 days
          } else if (day <= 28) {
            performance = 1.30 + ((day - 21) * 0.15 / 7) // 1.30 to 1.45 in next 7 days
          } else {
            performance = 1.45 + ((day - 28) * 0.14 / 7) // 1.45 to 1.59 in final 7 days
          }
          break
        case 'weight':
          // Progressive weight growth starting from 0
          performance = day === 0 ? 0 : 50 + (day * defaultStandard.adg * 0.8)
          break
        case 'mortality':
          // Progressive mortality that increases slightly over time
          performance = day === 0 ? 0 : defaultStandard.mortality_rate * (0.1 + (day * 0.025))
          break
        }
        data.push({ day, performance })
      }
      return data
    }
    
    const data = []
    for (let day = 0; day <= 35; day++) {
      let performance = 0
      switch (metricType) {
        case 'adg':
          // Progressive ADG that increases over time (starts low, builds up)
          performance = Math.max(0, selectedStandard.adg * 0.3 + (day * selectedStandard.adg * 0.02))
          break
        case 'fcr':
          // Progressive FCR that matches Excel data exactly: starts at 0 and follows Excel curve
          if (day === 0) {
            performance = 0
          } else if (day <= 7) {
            performance = 0 + (day * 0.90 / 7) // 0 to 0.90 in first 7 days
          } else if (day <= 14) {
            performance = 0.90 + ((day - 7) * 0.19 / 7) // 0.90 to 1.09 in next 7 days
          } else if (day <= 21) {
            performance = 1.09 + ((day - 14) * 0.21 / 7) // 1.09 to 1.30 in next 7 days
          } else if (day <= 28) {
            performance = 1.30 + ((day - 21) * 0.15 / 7) // 1.30 to 1.45 in next 7 days
          } else {
            performance = 1.45 + ((day - 28) * 0.14 / 7) // 1.45 to 1.59 in final 7 days
          }
          break
        case 'weight':
          // Progressive weight growth starting from 0
          performance = day === 0 ? 0 : 50 + (day * selectedStandard.adg * 0.8)
          break
        case 'mortality':
          // Progressive mortality that increases slightly over time
          performance = day === 0 ? 0 : selectedStandard.mortality_rate * (0.1 + (day * 0.025))
          break
      }
      data.push({ day, performance })
    }
    return data
  }

  const handleStandardChange = (standard: PerformanceStandard) => {
    setSelectedStandard(standard)
  }

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Performance Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Add buildings and daily production records to see performance analytics.
          </p>
        </div>
      </div>
    )
  }

  if (!buildingPerformance.length) {
    return (
      <div className="w-full p-6">
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Performance Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {error ? 'Unable to load performance data.' : 'Add buildings and daily production records to see performance analytics.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Building Performance Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Analyzing {buildingPerformance.length} building{buildingPerformance.length !== 1 ? 's' : ''} - {buildingPerformance.map((b: BuildingData) => b.buildingName).join(', ')}
        </p>
      </div>

      {/* Standard Selector */}
      <StandardSelector farmId={farmId} onStandardChange={handleStandardChange} />

      {/* Building Performance Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mortality Rate Chart */}
        <SimpleClickableChart
          title={METRICS.mortality.title}
          className="bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-800 p-6"
          modalContent={
            <BuildingPerformanceLineChartLargeRecharts
              farmId={farmId}
              metricType="mortality"
              standardData={getStandardData('mortality')}
              title={METRICS.mortality.title}
              yAxisLabel={METRICS.mortality.yAxisLabel}
              yAxisUnit={METRICS.mortality.yAxisUnit}
            />
          }
        >
          <BuildingPerformanceLineChartRecharts
            farmId={farmId}
            metricType="mortality"
            standardData={getStandardData('mortality')}
            title={METRICS.mortality.title}
            yAxisLabel={METRICS.mortality.yAxisLabel}
            yAxisUnit={METRICS.mortality.yAxisUnit}
          />
        </SimpleClickableChart>

        {/* FCR Chart */}
        <SimpleClickableChart
          title={METRICS.fcr.title}
          className="bg-white dark:bg-gray-800 rounded-xl border border-blue-100 dark:border-blue-800 p-6"
          modalContent={
            <BuildingPerformanceLineChartLargeRecharts
              farmId={farmId}
              metricType="fcr"
              standardData={getStandardData('fcr')}
              title={METRICS.fcr.title}
              yAxisLabel={METRICS.fcr.yAxisLabel}
              yAxisUnit={METRICS.fcr.yAxisUnit}
            />
          }
        >
          <BuildingPerformanceLineChartRecharts
            farmId={farmId}
            metricType="fcr"
            standardData={getStandardData('fcr')}
            title={METRICS.fcr.title}
            yAxisLabel={METRICS.fcr.yAxisLabel}
            yAxisUnit={METRICS.fcr.yAxisUnit}
          />
        </SimpleClickableChart>

        {/* Weight Chart */}
        <SimpleClickableChart
          title={METRICS.weight.title}
          className="bg-white dark:bg-gray-800 rounded-xl border border-green-100 dark:border-green-800 p-6"
          modalContent={
            <BuildingPerformanceLineChartLargeRecharts
              farmId={farmId}
              metricType="weight"
              standardData={getStandardData('weight')}
              title={METRICS.weight.title}
              yAxisLabel={METRICS.weight.yAxisLabel}
              yAxisUnit={METRICS.weight.yAxisUnit}
            />
          }
        >
          <BuildingPerformanceLineChartRecharts
            farmId={farmId}
            metricType="weight"
            standardData={getStandardData('weight')}
            title={METRICS.weight.title}
            yAxisLabel={METRICS.weight.yAxisLabel}
            yAxisUnit={METRICS.weight.yAxisUnit}
          />
        </SimpleClickableChart>

        {/* ADG Chart */}
        <SimpleClickableChart
          title={METRICS.adg.title}
          className="bg-white dark:bg-gray-800 rounded-xl border border-orange-100 dark:border-orange-800 p-6"
          modalContent={
            <BuildingPerformanceLineChartLargeRecharts
              farmId={farmId}
              metricType="adg"
              standardData={getStandardData('adg')}
              title={METRICS.adg.title}
              yAxisLabel={METRICS.adg.yAxisLabel}
              yAxisUnit={METRICS.adg.yAxisUnit}
            />
          }
        >
          <BuildingPerformanceLineChartRecharts
            farmId={farmId}
            metricType="adg"
            standardData={getStandardData('adg')}
            title={METRICS.adg.title}
            yAxisLabel={METRICS.adg.yAxisLabel}
            yAxisUnit={METRICS.adg.yAxisUnit}
          />
        </SimpleClickableChart>
      </div>

            {/* Performance Summary */}
      {selectedStandard && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Performance Summary (Current) - {selectedStandard.name} Standard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Mortality Rate</h4>
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">Standard: {selectedStandard.mortality_rate}%</p>
              {buildingPerformance.map((building: BuildingData, index: number) => {
                const isGood = building.metrics.mortalityRate <= selectedStandard.mortality_rate
                return (
                  <p key={building.buildingId} className="text-sm" style={{ color: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b' }}>
                    B{index + 1}: {building.metrics.mortalityRate.toFixed(1)}% {isGood ? '✓' : '▲'}
                  </p>
                )
              })}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Feed Conversion</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">Standard: {selectedStandard.fcr}</p>
              {buildingPerformance.map((building: BuildingData, index: number) => {
                const isGood = building.metrics.fcr <= selectedStandard.fcr
                return (
                  <p key={building.buildingId} className="text-sm" style={{ color: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b' }}>
                    B{index + 1}: {building.metrics.fcr.toFixed(2)} {isGood ? '✓' : '▲'}
                  </p>
                )
              })}
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">Average Weight</h4>
              <p className="text-sm text-green-600 dark:text-green-400 mb-2">Standard: {selectedStandard.avg_weight}g</p>
              {buildingPerformance.map((building: BuildingData, index: number) => {
                const isGood = building.metrics.currentWeight >= selectedStandard.avg_weight
                return (
                  <p key={building.buildingId} className="text-sm" style={{ color: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b' }}>
                    B{index + 1}: {building.metrics.currentWeight.toFixed(0)}g {isGood ? '✓' : '▲'}
                  </p>
                )
              })}
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2">Daily Gain</h4>
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-2">Standard: {selectedStandard.adg}g</p>
              {buildingPerformance.map((building: BuildingData, index: number) => {
                const isGood = building.metrics.averageDailyGain >= selectedStandard.adg
                return (
                  <p key={building.buildingId} className="text-sm" style={{ color: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b' }}>
                    B{index + 1}: {building.metrics.averageDailyGain.toFixed(0)}g {isGood ? '✓' : '▲'}
                  </p>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 