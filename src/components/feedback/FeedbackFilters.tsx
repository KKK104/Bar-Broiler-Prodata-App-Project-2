"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter } from "lucide-react"

interface FeedbackFilters {
  status?: string
  type?: string
  priority?: string
}

interface FeedbackFiltersProps {
  filters: FeedbackFilters
  onFiltersChange: (filters: FeedbackFilters) => void
}

export function FeedbackFilters({ filters, onFiltersChange }: FeedbackFiltersProps) {
  const handleFilterChange = (key: keyof FeedbackFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center space-x-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Filters:</span>
      </div>
      
      <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.type || "all"} onValueChange={(value) => handleFilterChange("type", value)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="bug">Bugs</SelectItem>
          <SelectItem value="suggestion">Suggestions</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.priority || "all"} onValueChange={(value) => handleFilterChange("priority", value)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
} 