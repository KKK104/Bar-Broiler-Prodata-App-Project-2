'use client'

interface BuildingADGData {
  day: number
  adg: number
}

interface ADGChartProps {
  // New multiple-building interface
  standardData?: Array<{
    day: number
    adg: number
  }>
  buildingsData?: Array<{
    id: string
    name: string
    shortCode: string // B1, B2, B3, etc.
    color: string
    data: BuildingADGData[]
  }>
  // Legacy interface for backward compatibility
  data?: Array<{
    day: number
    standard: number
    actual: number
  }>
}

export function ADGChart({ standardData, buildingsData, data }: ADGChartProps) {
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
            points={data.map((d, i) => `${50 + i * 80},${180 - d.standard * 2}`).join(' ')}
          />
          
          <polyline
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            points={data.map((d, i) => `${50 + i * 80},${180 - d.actual * 2}`).join(' ')}
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
        <span>No ADG data available</span>
      </div>
    )
  }

  // Calculate chart dimensions and scales - MUCH LARGER SIZE FOR BETTER READABILITY
  const width = 1600
  const height = 1000
  const padding = { top: 140, right: 250, bottom: 140, left: 180 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Find max values for scaling (ADG typically ranges 40-90g/day)
  const allADGValues = [
    ...standardData.map(d => d.adg),
    ...buildingsData.flatMap(building => building.data.map(d => d.adg))
  ]
  const maxADG = Math.max(...allADGValues, 90) // Match reference scale
  const minADG = Math.min(...allADGValues, 40) // Min scale of 40g/day
  const adgRange = maxADG - minADG
  const maxDay = 35 // Fixed to 35 days as requested

  // Scaling functions - adjust for 1-35 day range
  const scaleX = (day: number) => padding.left + ((day - 1) / (maxDay - 1)) * chartWidth
  const scaleY = (adg: number) => padding.top + chartHeight - ((adg - minADG) / adgRange) * chartHeight

  // Generate path string for a line
  const generatePath = (data: BuildingADGData[]) => {
    if (data.length === 0) return ""
    return data.map((d, i) => 
      `${i === 0 ? 'M' : 'L'} ${scaleX(d.day)} ${scaleY(d.adg)}`
    ).join(' ')
  }

  return (
    <div className="w-full h-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <pattern id="grid-adg" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
          {/* Clipping path to keep lines within chart boundaries */}
          <clipPath id="chart-clip-adg">
            <rect 
              x={padding.left} 
              y={padding.top} 
              width={chartWidth} 
              height={chartHeight}
            />
          </clipPath>
        </defs>
        
        {/* Grid background */}
        <rect width="100%" height="100%" fill="url(#grid-adg)" />
        
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
        
        {/* Y-axis grid lines */}
        {[40, 50, 60, 70, 80, 90].map(value => (
          <g key={value}>
            <line
              x1={padding.left}
              y1={scaleY(value)}
              x2={padding.left + chartWidth}
              y2={scaleY(value)}
              stroke="#e5e7eb"
              strokeWidth="2"
              strokeDasharray="4,4"
            />
            <text
              x={padding.left - 20}
              y={scaleY(value)}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-base fill-gray-700 font-semibold"
            >
              {value}g
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
        
        {/* Standard ADG line (Red) - SOLID LINE ONLY, NO DOTS, STAYS WITHIN BOUNDS */}
        {standardData.length > 0 && (
          <g clipPath="url(#chart-clip-adg)">
            {/* Enhanced standard line that stays within chart boundaries */}
            <path
              d={generatePath(standardData)}
              fill="none"
              stroke="#ef4444"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
            {/* NO DOTS on standard line - removed */}
          </g>
        )}
        
        {/* Building ADG data - DOTS ONLY (no connecting lines) */}
        {buildingsData.map((building) => (
          <g key={building.id} clipPath="url(#chart-clip-adg)">
            {/* Data points as dots only - no connecting lines */}
            {building.data.map((point, i) => (
              <circle
                key={i}
                cx={scaleX(point.day)}
                cy={scaleY(point.adg)}
                r="6"
                fill={building.color}
                stroke="white"
                strokeWidth="3"
                opacity="0.9"
              />
            ))}
          </g>
        ))}
        
        {/* Legend */}
        <g>
          {/* Standard legend */}
          <g>
            <line
              x1={padding.left + chartWidth + 15}
              y1={40}
              x2={padding.left + chartWidth + 35}
              y2={40}
              stroke="#ef4444"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <text
              x={padding.left + chartWidth + 45}
              y={40}
              dominantBaseline="middle"
              className="text-lg fill-red-600 font-bold"
            >
              STANDARD
            </text>
          </g>
          
          {/* Building legends - show as dots */}
          {buildingsData.map((building, i) => (
            <g key={building.id}>
              <circle
                cx={padding.left + chartWidth + 25}
                cy={70 + i * 30}
                r="6"
                fill={building.color}
                stroke="white"
                strokeWidth="3"
              />
              <text
                x={padding.left + chartWidth + 45}
                y={70 + i * 30}
                dominantBaseline="middle"
                className="text-lg font-bold"
                fill={building.color}
              >
                ACTUAL
              </text>
            </g>
          ))}
        </g>
        
                  {/* Chart title */}
          <text
            x={width / 2}
            y={50}
            textAnchor="middle"
            className="text-3xl font-bold fill-gray-800"
          >
            Average Daily Gain
          </text>
          
          {/* Y-axis label */}
          <text
            x="60"
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 60, ${height / 2})`}
            className="text-xl fill-gray-700 font-bold"
          >
            ADG (grams/day)
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
  )
} 