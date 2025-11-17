"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Database, Zap, TrendingUp } from "lucide-react"

interface PerformanceMetrics {
  totalQueries: number
  cacheHits: number
  databaseQueries: number
  averageResponseTime: number
  lastQueryTime: number
  errors: number
}

interface VerificationPerformanceMonitorProps {
  isVisible?: boolean
}

export function VerificationPerformanceMonitor({ isVisible = false }: VerificationPerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalQueries: 0,
    cacheHits: 0,
    databaseQueries: 0,
    averageResponseTime: 0,
    lastQueryTime: 0,
    errors: 0
  })

  useEffect(() => {
    if (!isVisible) return

    // Listen for performance events
    const handlePerformanceEvent = (event: CustomEvent) => {
      const { type, duration, success } = event.detail
      
      setMetrics(prev => {
        const newMetrics = { ...prev }
        
        if (type === 'cache_hit') {
          newMetrics.cacheHits++
          newMetrics.totalQueries++
        } else if (type === 'database_query') {
          newMetrics.databaseQueries++
          newMetrics.totalQueries++
          if (!success) newMetrics.errors++
        }
        
        // Update average response time
        if (duration) {
          const totalTime = prev.averageResponseTime * (prev.totalQueries - 1) + duration
          newMetrics.averageResponseTime = totalTime / newMetrics.totalQueries
        }
        
        newMetrics.lastQueryTime = Date.now()
        
        return newMetrics
      })
    }

    window.addEventListener('verification-performance', handlePerformanceEvent as EventListener)
    
    return () => {
      window.removeEventListener('verification-performance', handlePerformanceEvent as EventListener)
    }
  }, [isVisible])

  if (!isVisible) return null

  const cacheHitRate = metrics.totalQueries > 0 ? (metrics.cacheHits / metrics.totalQueries * 100).toFixed(1) : '0'
  const errorRate = metrics.totalQueries > 0 ? (metrics.errors / metrics.totalQueries * 100).toFixed(1) : '0'

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span>Verification Performance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Queries:</span>
            <Badge variant="secondary">{metrics.totalQueries}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Cache Hits:</span>
            <Badge variant="outline" className="text-green-600">
              {metrics.cacheHits} ({cacheHitRate}%)
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">DB Queries:</span>
            <Badge variant="outline" className="text-blue-600">
              {metrics.databaseQueries}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Errors:</span>
            <Badge variant="outline" className="text-red-600">
              {metrics.errors} ({errorRate}%)
            </Badge>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Avg Response:</span>
            <span className="font-mono">
              {metrics.averageResponseTime > 0 ? `${metrics.averageResponseTime.toFixed(1)}ms` : 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}







