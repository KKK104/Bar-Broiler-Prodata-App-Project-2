"use client"

import { Button } from "@/components/ui/button"

interface FeedbackStatsProps {
  totalCount: number
  onRefresh: () => void
}

export function FeedbackStats({ totalCount, onRefresh }: FeedbackStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Feedback Overview
          </h2>
          <p className="text-gray-600">
            {totalCount} feedback items
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline">
          Refresh Data
        </Button>
      </div>
    </div>
  )
} 