'use client'

import { useEffect, useState } from 'react'
import { useDailyRecords } from '@/hooks/useDailyRecords'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface BuildingPerformanceData {
  day: number
  performance: number
}

interface BuildingPerformanceLineChartRechartsProps {
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

export function BuildingPerformanceLineChartRecharts({ 
  farmId, 
  metricType = 'adg',
  standardData = [],
  title = 'Building Performance Overview',
  yAxisLabel = 'Performance',
  yAxisUnit = ''
}: BuildingPerformanceLineChartRechartsProps) {
  const { buildingPerformance, loading, error, getChartData } = useDailyRecords(farmId)
  const [chartData, setChartData] = useState<Array<{
    day: number
    standard: number
    [key: string]: number // For dynamic building data (B1, B2, B3, etc.)
  }>>([])
  const [buildingsList, setBuildingsList] = useState<Array<{
    id: string
    name: string
    shortCode: string
    color: string
  }>>([])

  useEffect(() => {
    if (!loading && buildingPerformance.length > 0) {
      // Get chart data from real daily records
      const buildingsData = getChartData(metricType)
      
      // Store buildings list for rendering lines
      setBuildingsList(buildingsData.map(building => ({
        id: building.id,
        name: building.name,
        shortCode: building.shortCode,
        color: building.color
      })))
      
      // Convert to Recharts format with multiple building lines
      const maxDay = Math.max(
        ...buildingsData.flatMap(building => building.data.map(d => d.day)),
        ...standardData.map(d => d.day)
      )
      
      const rechartsData = []
      for (let day = 1; day <= maxDay; day++) {
        const standardPoint = standardData.find(d => d.day === day)
        
        const dayData: any = {
          day,
          standard: standardPoint?.performance || 0
        }
        
        // Add data for each building
        buildingsData.forEach(building => {
          const buildingPoint = building.data.find(d => d.day === day)
          dayData[building.shortCode] = buildingPoint?.performance || 0
        })
        
        rechartsData.push(dayData)
      }
      
      setChartData(rechartsData)
    } else if (!loading) {
      setChartData([])
      setBuildingsList([])
    }
  }, [buildingPerformance, loading, metricType, getChartData, standardData])

  // Get domain and formatting based on metric type
  const getMetricConfig = () => {
    switch (metricType) {
      case 'fcr':
        return {
          domain: [0, 1.6],
          formatter: (value: number) => value.toFixed(2),
          label: 'FCR'
        }
      case 'mortality':
        return {
          domain: [0, 10],
          formatter: (value: number) => `${value.toFixed(1)}%`,
          label: 'Mortality (%)'
        }
      case 'weight':
        return {
          domain: [0, 2500],
          formatter: (value: number) => `${value.toFixed(0)}g`,
          label: 'Weight (g)'
        }
      case 'adg':
        return {
          domain: [40, 90],
          formatter: (value: number) => `${value.toFixed(1)}g`,
          label: 'ADG (g/day)'
        }
      default:
        return {
          domain: [0, 100],
          formatter: (value: number) => value.toFixed(1),
          label: 'Performance'
        }
    }
  }

  const metricConfig = getMetricConfig()

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-gray-500">Loading chart data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-red-500">Error loading chart data: {error}</div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-gray-500">No data available for {title}</div>
      </div>
    )
  }

  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="day"
            stroke="#666"
            fontSize={12}
            label={{ value: "Age in Days", position: "insideBottom", offset: -10 }}
          />
          <YAxis
            stroke="#666"
            fontSize={12}
            domain={metricConfig.domain}
            label={{ value: metricConfig.label, angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
            formatter={(value: number, name: string) => [metricConfig.formatter(value), name.toUpperCase()]}
            labelFormatter={(label) => `Day ${label}`}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
          <Line 
            type="monotone" 
            dataKey="standard" 
            stroke="#dc2626" 
            strokeWidth={2} 
            name="STANDARD" 
            dot={false} 
          />
          {buildingsList.map((building) => (
            <Line 
              key={building.id}
              type="monotone" 
              dataKey={building.shortCode} 
              stroke={building.color} 
              strokeWidth={2} 
              name={building.shortCode} 
              dot={false} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
