'use client'

import { useState } from 'react'
import { BuildingPerformanceLineChart } from './charts/BuildingPerformanceLineChart'

export function BuildingPerformanceDemo({ farmId }: { farmId: string }) {
  const [selectedMetric, setSelectedMetric] = useState<'adg' | 'fcr' | 'weight' | 'mortality'>('adg')

  // Sample standard data for comparison
  const getStandardData = (metricType: typeof selectedMetric) => {
    const data = []
    for (let day = 1; day <= 35; day++) {
      let performance = 0
      switch (metricType) {
        case 'adg':
          performance = 45 + (day * 1.0) // Standard ADG growth
          break
        case 'fcr':
          performance = 1.3 + (day * 0.015) // Standard FCR
          break
        case 'weight':
          performance = 60 + (day * day * 1.8) // Standard weight growth
          break
        case 'mortality':
          performance = 0.3 // Standard mortality rate
          break
      }
      data.push({ day, performance })
    }
    return data
  }

  const getMetricInfo = (metricType: typeof selectedMetric) => {
    switch (metricType) {
      case 'adg':
        return { title: 'Average Daily Gain', yAxisLabel: 'Daily Gain', yAxisUnit: 'g/day' }
      case 'fcr':
        return { title: 'Feed Conversion Ratio', yAxisLabel: 'FCR', yAxisUnit: '' }
      case 'weight':
        return { title: 'Average Weight', yAxisLabel: 'Weight', yAxisUnit: 'g' }
      case 'mortality':
        return { title: 'Mortality Rate', yAxisLabel: 'Mortality', yAxisUnit: '%' }
    }
  }

  const metricInfo = getMetricInfo(selectedMetric)

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Building Performance Analysis</h2>
        
        {/* Metric Selector */}
        <div className="flex gap-2">
          {(['adg', 'fcr', 'weight', 'mortality'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === metric
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {metric.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <BuildingPerformanceLineChart
        farmId={farmId}
        metricType={selectedMetric}
        standardData={getStandardData(selectedMetric)}
        title={metricInfo.title}
        yAxisLabel={metricInfo.yAxisLabel}
        yAxisUnit={metricInfo.yAxisUnit}
      />
    </div>
  )
} 