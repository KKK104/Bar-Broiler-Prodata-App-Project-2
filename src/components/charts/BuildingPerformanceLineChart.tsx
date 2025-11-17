'use client'

import { useEffect, useState } from 'react'
import { useDailyRecords } from '@/hooks/useDailyRecords'

interface BuildingPerformanceData {
  day: number
  performance: number // This could be FCR, ADG, Weight, etc.
}

interface BuildingPerformanceLineChartProps {
  farmId: string
  metricType: 'adg' | 'fcr' | 'weight' | 'mortality'
  standardData?: Array<{
    day: number
    performance: number
  }>
  title?: string
  yAxisLabel?: string
  yAxisUnit?: string
}

export function BuildingPerformanceLineChart({ 
  farmId, 
  metricType = 'adg',
  standardData = [],
  title = 'Building Performance Overview',
  yAxisLabel = 'Performance',
  yAxisUnit = ''
}: BuildingPerformanceLineChartProps) {
  const { buildingPerformance, loading, error, getChartData } = useDailyRecords(farmId)
  const [buildingsData, setBuildingsData] = useState<Array<{
    id: string
    name: string
    shortCode: string
    color: string
    data: BuildingPerformanceData[]
  }>>([])

  useEffect(() => {
    if (!loading && buildingPerformance.length > 0) {
      // Get chart data from real daily records
      const chartData = getChartData(metricType)
      setBuildingsData(chartData)
    } else if (!loading) {
      setBuildingsData([])
    }
  }, [buildingPerformance, loading, metricType, getChartData])

  // Helper function to check if building has data
  const hasBuildingData = (buildingId: string) => {
    const building = buildingPerformance.find(b => b.buildingId === buildingId)
    return building && building.records.length > 0
  }

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded">
        <span>Loading building performance data...</span>
      </div>
    )
  }

  if (buildingsData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-2">📊</div>
          <div className="text-gray-500 font-medium">No building data available</div>
          <div className="text-gray-400 text-xs mt-1">Add daily records to see performance charts</div>
        </div>
      </div>
    )
  }

  // Calculate chart dimensions and scales - MUCH LARGER SIZE FOR BETTER READABILITY
  const width = 1600
  const height = 1000
  const padding = { top: 140, right: 250, bottom: 140, left: 180 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom



  // Find max values for scaling
  const allPerformanceValues = [
    ...standardData.map(d => d.performance),
    ...buildingsData.flatMap(building => building.data.map(d => d.performance))
  ]
  
  // Filter out invalid values
  const validValues = allPerformanceValues.filter(v => !isNaN(v) && isFinite(v))
  
  let maxPerformance = validValues.length > 0 ? Math.max(...validValues) : 100
  let minPerformance = validValues.length > 0 ? Math.min(...validValues) : 0
  
  // Set appropriate scales based on metric type
  switch (metricType) {
    case 'adg':
      maxPerformance = Math.max(maxPerformance, 90)
      minPerformance = Math.min(minPerformance, 30)
      break
    case 'fcr':
      maxPerformance = Math.max(maxPerformance, 1.6)
      minPerformance = Math.min(minPerformance, 0)
      break
    case 'weight':
      maxPerformance = Math.max(maxPerformance, 2500)
      minPerformance = Math.min(minPerformance, 0)
      break
    case 'mortality':
      maxPerformance = Math.max(maxPerformance, 10)
      minPerformance = 0
      break
  }
  
  const performanceRange = maxPerformance - minPerformance || 1 // Prevent division by zero
  const maxDay = 35 // Fixed to 35 days as requested

  // Scaling functions - adjust for 1-35 day range
  const scaleX = (day: number) => padding.left + ((day - 1) / (maxDay - 1)) * chartWidth
  const scaleY = (performance: number) => {
    if (performanceRange === 0) return padding.top + chartHeight / 2 // Center if no range
    return padding.top + chartHeight - ((performance - minPerformance) / performanceRange) * chartHeight
  }

  // Generate path string for a line
  const generatePath = (data: BuildingPerformanceData[]) => {
    if (data.length === 0) return ""
    return data.map((d, i) => 
      `${i === 0 ? 'M' : 'L'} ${scaleX(d.day)} ${scaleY(d.performance)}`
    ).join(' ')
  }

  // Generate Y-axis grid values
  const getYAxisValues = () => {
    switch (metricType) {
      case 'adg':
        return [30, 40, 50, 60, 70, 80, 90]
      case 'fcr':
        return [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0]
      case 'weight':
        return [0, 500, 1000, 1500, 2000, 2500, 3000]
      case 'mortality':
        return [0, 1, 2, 3, 4, 5]
      default:
        return []
    }
  }

  return (
    <div className="w-full">
      {/* Building Performance Overview Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        
        {/* Building Color Legend */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Standard */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-red-500 rounded"></div>
            <span className="text-sm text-red-600 font-medium">Standard</span>
            <span className="text-xs text-gray-500">Target Performance</span>
          </div>
          
          {/* Buildings */}
          {buildingsData.map((building, index) => {
            const hasData = hasBuildingData(building.id)
            const opacity = hasData ? 1 : 0.1
            
            return (
              <div key={building.id} className="flex items-center gap-2" style={{ opacity }}>
                <div 
                  className="w-4 h-1 rounded" 
                  style={{ backgroundColor: building.color }}
                ></div>
                <span 
                  className="text-sm font-medium" 
                  style={{ color: building.color }}
                >
                  {building.shortCode}
                </span>
                <span className="text-xs text-gray-500">{building.name}</span>
                {!hasData && (
                  <span className="text-xs text-gray-400">(No data)</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

             {/* Chart */}
       <div className="w-full" style={{ height: '600px' }}>
         <svg 
           viewBox={`0 0 ${width} ${height}`} 
           className="w-full h-full" 
           style={{ maxHeight: '550px', display: 'block' }}
           preserveAspectRatio="xMidYMid meet"
         >
          <defs>
            <pattern id={`grid-performance-${metricType}`} width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          
          {/* Grid background */}
          <rect width="100%" height="100%" fill={`url(#grid-performance-${metricType})`} />
          
          {/* Chart area background */}
          <rect 
            x={padding.left} 
            y={padding.top} 
            width={chartWidth} 
            height={chartHeight} 
            fill="white" 
            fillOpacity="0.95"
            stroke="#d1d5db" 
            strokeWidth="1"
          />
          

          
                     {/* Y-axis grid lines */}
           {getYAxisValues().map(value => (
             <g key={value}>
               <line
                 x1={padding.left}
                 y1={scaleY(value)}
                 x2={padding.left + chartWidth}
                 y2={scaleY(value)}
                 stroke="#e5e7eb"
                 strokeWidth="1.5"
                 strokeDasharray="4,4"
               />
               <text
                 x={padding.left - 15}
                 y={scaleY(value)}
                 textAnchor="end"
                 dominantBaseline="middle"
                 className="text-sm fill-gray-600 font-medium"
               >
                 {value}{yAxisUnit}
               </text>
             </g>
           ))}
          
                               {/* X-axis grid lines - Show ALL days 1-35 with individual labels */}
          {Array.from({ length: 35 }, (_, i) => i + 1).map(day => (
            <g key={day}>
              <line
                x1={scaleX(day)}
                y1={padding.top}
                x2={scaleX(day)}
                y2={padding.top + chartHeight}
                stroke="#f3f4f6"
                strokeWidth="1"
                strokeDasharray="1,1"
              />
              {/* Show labels for every day */}
            <text
              x={scaleX(day)}
              y={height - 15}
              textAnchor="middle"
              className="text-sm fill-gray-700 font-medium"
            >
              {day}
            </text>
            </g>
          ))}
          
                     {/* Standard performance line (Red) - SOLID LINE ONLY, NO DOTS, STARTS FROM DAY 0 */}
           {standardData.length > 0 && (
             <g>
               {/* Enhanced standard line starting from day 0 with proper value */}
               <path
                 d={`M ${padding.left} ${scaleY(standardData[0]?.performance || 0)} ${generatePath(standardData)}`}
                 fill="none"
                 stroke="#ef4444"
                 strokeWidth="4"
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 opacity="0.9"
               />
               {/* NO DOTS on standard line - removed */}
             </g>
           )}
          
          {/* Building performance data - DOTS ONLY (no connecting lines) */}
          {buildingsData.map((building) => (
            <g key={building.id}>
              {/* Data points as dots only - no connecting lines */}
              {building.data.map((point, i) => (
                <circle
                  key={i}
                  cx={scaleX(point.day)}
                  cy={scaleY(point.performance)}
                  r="5"
                  fill={building.color}
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.9"
                />
              ))}
            </g>
          ))}
          
                     {/* Chart title */}
           <text
             x={width / 2}
             y={45}
             textAnchor="middle"
             className="text-xl font-bold fill-gray-800"
           >
             {title} - {metricType.toUpperCase()} Performance Over Time
           </text>
           
           {/* Y-axis label */}
           <text
             x="50"
             y={height / 2}
             textAnchor="middle"
             transform={`rotate(-90, 50, ${height / 2})`}
             className="text-base fill-gray-600 font-medium"
           >
             {yAxisLabel} {yAxisUnit && `(${yAxisUnit})`}
           </text>
           
           {/* X-axis label */}
          <text
            x={width / 2}
            y={height - 8}
            textAnchor="middle"
            className="text-xl fill-gray-700 font-semibold"
          >
            Age in Days
          </text>
        </svg>
      </div>
    </div>
  )
} 