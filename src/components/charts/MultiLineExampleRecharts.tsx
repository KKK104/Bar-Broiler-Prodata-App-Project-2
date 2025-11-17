'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FCRChartRecharts } from './FCRChartRecharts'
import { MortalityChartRecharts } from './MortalityChartRecharts'
import { WeightChartRecharts } from './WeightChartRecharts'
import { ADGChartRecharts } from './ADGChartRecharts'

interface ChartDataPoint {
  day: number
  standard: number
  actual: number
}

export function MultiLineExampleRecharts() {
  const [fcrData, setFcrData] = useState<ChartDataPoint[]>([])
  const [mortalityData, setMortalityData] = useState<ChartDataPoint[]>([])
  const [weightData, setWeightData] = useState<ChartDataPoint[]>([])
  const [adgData, setAdgData] = useState<ChartDataPoint[]>([])

  useEffect(() => {
    // Generate FCR data (1-36 days)
    const fcrStandardData = Array.from({ length: 36 }, (_, i) => {
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
      return Math.min(fcr, 1.45)
    })

    const fcrActualData = Array.from({ length: 36 }, (_, i) => {
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
      return Math.min(fcr, 1.5)
    })

    const fcrChartData = Array.from({ length: 36 }, (_, i) => ({
      day: i + 1,
      standard: fcrStandardData[i],
      actual: fcrActualData[i]
    }))

    // Generate Mortality data (1-35 days)
    const mortalityStandardData = Array.from({ length: 35 }, (_, i) => {
      const day = i + 1
      return Math.min(0.1 + day * 0.15, 5.0)
    })

    const mortalityActualData = Array.from({ length: 35 }, (_, i) => {
      const day = i + 1
      return Math.min(0.2 + day * 0.12 + Math.sin(day * 0.5) * 0.5, 4.5)
    })

    const mortalityChartData = Array.from({ length: 35 }, (_, i) => ({
      day: i + 1,
      standard: mortalityStandardData[i],
      actual: mortalityActualData[i]
    }))

    // Generate Weight data (1-35 days)
    const weightStandardData = Array.from({ length: 35 }, (_, i) => {
      const day = i + 1
      return Math.min(45 + day * 65, 2300)
    })

    const weightActualData = Array.from({ length: 35 }, (_, i) => {
      const day = i + 1
      return Math.min(40 + day * 60 + Math.sin(day * 0.3) * 50, 2200)
    })

    const weightChartData = Array.from({ length: 35 }, (_, i) => ({
      day: i + 1,
      standard: weightStandardData[i],
      actual: weightActualData[i]
    }))

    // Generate ADG data (1-35 days)
    const adgStandardData = Array.from({ length: 35 }, (_, i) => {
      const day = i + 1
      return Math.min(45 + day * 1.2, 85)
    })

    const adgActualData = Array.from({ length: 35 }, (_, i) => {
      const day = i + 1
      return Math.min(42 + day * 1.1 + Math.sin(day * 0.4) * 3, 82)
    })

    const adgChartData = Array.from({ length: 35 }, (_, i) => ({
      day: i + 1,
      standard: adgStandardData[i],
      actual: adgActualData[i]
    }))

    setFcrData(fcrChartData)
    setMortalityData(mortalityChartData)
    setWeightData(weightChartData)
    setAdgData(adgChartData)
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* FCR Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>FCR Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <FCRChartRecharts data={fcrData} />
          </CardContent>
        </Card>

        {/* Mortality Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Mortality Rate Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <MortalityChartRecharts data={mortalityData} />
          </CardContent>
        </Card>

        {/* Weight Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weight Growth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <WeightChartRecharts data={weightData} />
          </CardContent>
        </Card>

        {/* ADG Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Average Daily Gain Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ADGChartRecharts data={adgData} />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

