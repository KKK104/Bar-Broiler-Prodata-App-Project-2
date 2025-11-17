'use client'

interface BuildingFCRData {
  day: number
  fcr: number
}

interface FCRChartProps {
  // New multiple-building interface
  standardData?: Array<{
    day: number
    fcr: number
  }>
  buildingsData?: Array<{
    id: string
    name: string
    shortCode: string // B1, B2, B3, etc.
    color: string
    data: BuildingFCRData[]
  }>
  // Legacy interface for backward compatibility
  data?: Array<{
    day: number
    standard: number
    actual: number
  }>
}

export function FCRChart({ standardData, buildingsData, data }: FCRChartProps) {
  // Handle legacy interface
  if (data && !standardData && !buildingsData) {
    return (
      <div className="w-full h-full">
        <svg viewBox="0 0 400 200" className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <polyline
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            points={data.map((d, i) => `${50 + i * 80},${180 - d.standard * 80}`).join(' ')}
          />
          
          <polyline
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            points={data.map((d, i) => `${50 + i * 80},${180 - d.actual * 80}`).join(' ')}
          />
          
          <text x="20" y="20" className="text-xs fill-red-500">Standard</text>
          <text x="20" y="35" className="text-xs fill-green-500">Actual</text>
        </svg>
      </div>
    )
  }

  // Handle new multiple-building interface
  if (!standardData || !buildingsData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <span>No FCR data available</span>
      </div>
    )
  }

  // Calculate chart dimensions and scales - MUCH LARGER SIZE FOR BETTER READABILITY
  const width = 1600
  const height = 1000
  const padding = { top: 140, right: 250, bottom: 140, left: 180 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Find max values for scaling (FCR should range 0-1.6 to match reference exactly)
  const allFCRValues = [
    ...standardData.map(d => d.fcr),
    ...buildingsData.flatMap(building => building.data.map(d => d.fcr))
  ]
  const maxFCR = Math.max(...allFCRValues, 1.6) // Match reference image exactly
  const minFCR = Math.min(...allFCRValues, 0) // Start from 0
  const fcrRange = maxFCR - minFCR
  const maxDay = 36 // Fixed to 36 days to match reference image

  // Scaling functions - adjust for 1-36 day range
  const scaleX = (day: number) => padding.left + ((day - 1) / (maxDay - 1)) * chartWidth
  const scaleY = (fcr: number) => padding.top + chartHeight - ((fcr - minFCR) / fcrRange) * chartHeight

  // Generate path string for a line
  const generatePath = (data: BuildingFCRData[]) => {
    if (data.length === 0) return ""
    return data.map((d, i) => 
      `${i === 0 ? 'M' : 'L'} ${scaleX(d.day)} ${scaleY(d.fcr)}`
    ).join(' ')
  }

  return (
    <div className="w-full h-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <pattern id="grid-fcr" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
          {/* Clipping path to keep lines within chart boundaries */}
          <clipPath id="chart-clip">
            <rect 
              x={padding.left} 
              y={padding.top} 
              width={chartWidth} 
              height={chartHeight}
            />
          </clipPath>
        </defs>
        
        {/* Grid background */}
        <rect width="100%" height="100%" fill="url(#grid-fcr)" />
        
        {/* Chart area background */}
        <rect 
          x={padding.left} 
          y={padding.top} 
          width={chartWidth} 
          height={chartHeight} 
          fill="white" 
          fillOpacity="0.8"
          stroke="#e5e7eb" 
          strokeWidth="1"
        />
        
        {/* Y-axis grid lines - Match reference image exactly */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6].map(value => (
          <g key={value}>
            <line
              x1={padding.left}
              y1={scaleY(value)}
              x2={padding.left + chartWidth}
              y2={scaleY(value)}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <text
              x={padding.left - 15}
              y={scaleY(value)}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-sm fill-gray-600 font-medium"
            >
              {value.toFixed(1)}
            </text>
          </g>
        ))}
        
        {/* X-axis grid lines - Show ALL days 1-36 with individual labels to match 2nd image */}
        {Array.from({ length: 36 }, (_, i) => i + 1).map(day => (
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
            {/* Show labels for every day - match 2nd image exactly */}
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
        
        {/* Standard FCR line (Blue) - SOLID LINE ONLY, NO DOTS, STAYS WITHIN BOUNDS */}
        {standardData.length > 0 && (
          <g clipPath="url(#chart-clip)">
            {/* Enhanced standard line that stays within chart boundaries */}
            <path
              d={generatePath(standardData)}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
            {/* NO DOTS on standard line - removed */}
          </g>
        )}
        
        {/* Building FCR data - ORANGE LINE (connected) to match reference */}
        {buildingsData.map((building) => (
          <g key={building.id} clipPath="url(#chart-clip)">
            {/* Connected line for actual data */}
            <path
              d={generatePath(building.data)}
              fill="none"
              stroke="#f97316"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </g>
        ))}
        
        {/* Legend - positioned in top-right corner like reference */}
        <g>
          {/* Standard legend */}
          <g>
            <line
              x1={width - 120}
              y1={60}
              x2={width - 100}
              y2={60}
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <text
              x={width - 95}
              y={60}
              dominantBaseline="middle"
              className="text-sm fill-blue-600 font-medium"
            >
              STANDARD
            </text>
          </g>
          
          {/* ACTUAL legend - show as orange line */}
          <g>
            <line
              x1={width - 120}
              y1={80}
              x2={width - 100}
              y2={80}
              stroke="#f97316"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <text
              x={width - 95}
              y={80}
              dominantBaseline="middle"
              className="text-sm fill-orange-600 font-medium"
            >
              ACTUAL
            </text>
          </g>
        </g>
        
                  {/* Chart title - match Excel format */}
          <text
            x={width / 2}
            y={40}
            textAnchor="middle"
            className="text-2xl font-bold fill-gray-800"
          >
            FCR
          </text>
          
          {/* Y-axis label - match reference format */}
          <text
            x="50"
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 50, ${height / 2})`}
            className="text-lg fill-gray-700 font-medium"
          >
            FCR
          </text>
          
          {/* X-axis label - match 2nd image format */}
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
    )
  }