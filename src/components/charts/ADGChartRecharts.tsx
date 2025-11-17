'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ADGDataPoint {
  day: number
  standard: number
  actual: number
}

interface ADGChartRechartsProps {
  data: ADGDataPoint[]
}

export function ADGChartRecharts({ data }: ADGChartRechartsProps) {
  return (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
            domain={[40, 90]}
            label={{ value: "ADG (g/day)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
            formatter={(value: number, name: string) => [value.toFixed(1), name.toUpperCase()]}
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
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#ff9500" 
            strokeWidth={2} 
            name="ACTUAL" 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

