"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import type { FarmData, DailyRecord } from "@/types/calculator"
import { AlertTriangle, Stethoscope } from "lucide-react"

interface PerformanceDashboardProps {
  farmData: FarmData
  dailyRecords: DailyRecord[]
}

export function PerformanceDashboard({ farmData, dailyRecords }: PerformanceDashboardProps) {
  const latestRecord = dailyRecords[dailyRecords.length - 1]
  if (!latestRecord) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Dashboard</CardTitle>
          <CardDescription>Add daily records to view performance analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="font-medium">No data available yet</p>
            <p className="text-sm">Start adding daily records to see performance metrics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ... (rest of the code as in the previous message, or let me know if you want the full code pasted again)
}
