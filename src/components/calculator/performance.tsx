"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Plus, Trash2 } from "lucide-react"

interface PenData {
  id: string
  totalBirds: number
  totalWeight: number
}

interface PerformanceData {
  numberOfPens: number
  pens: PenData[]
  alw: number
  adg: number
  fcr: number
}

interface PerformanceProps {
  farmData: any
  onSave?: (data: PerformanceData) => void
}

export function Performance({ farmData, onSave }: PerformanceProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    numberOfPens: 0,
    pens: [],
    alw: 0,
    adg: 0,
    fcr: 0
  })

  const [loading, setLoading] = useState(false)

  // Update pens when numberOfPens changes
  useEffect(() => {
    const currentPens = performanceData.pens
    const newPens: PenData[] = []
    
    for (let i = 0; i < performanceData.numberOfPens; i++) {
      newPens.push({
        id: `pen-${i + 1}`,
        totalBirds: currentPens[i]?.totalBirds || 0,
        totalWeight: currentPens[i]?.totalWeight || 0
      })
    }
    
    setPerformanceData(prev => ({
      ...prev,
      pens: newPens
    }))
  }, [performanceData.numberOfPens])

  // Calculate ALW (Average Live Weight)
  const calculateALW = () => {
    if (performanceData.pens.length === 0) return 0
    
    const totalBirds = performanceData.pens.reduce((sum, pen) => sum + pen.totalBirds, 0)
    const totalWeight = performanceData.pens.reduce((sum, pen) => sum + pen.totalWeight, 0)
    
    if (totalBirds === 0) return 0
    
    return totalWeight / totalBirds
  }

  // Calculate ADG (Average Daily Gain) - This would need age and initial weight data
  const calculateADG = () => {
    // For now, return a placeholder calculation
    // In a real implementation, this would need age and initial weight data
    return 0
  }

  // Calculate FCR (Feed Conversion Ratio) - This would need feed consumption data
  const calculateFCR = () => {
    // For now, return a placeholder calculation
    // In a real implementation, this would need feed consumption data
    return 0
  }

  // Update calculations when pen data changes
  useEffect(() => {
    const alw = calculateALW()
    const adg = calculateADG()
    const fcr = calculateFCR()
    
    setPerformanceData(prev => ({
      ...prev,
      alw,
      adg,
      fcr
    }))
  }, [performanceData.pens])

  const handleNumberOfPensChange = (value: string) => {
    const numPens = parseInt(value) || 0
    setPerformanceData(prev => ({
      ...prev,
      numberOfPens: numPens
    }))
  }

  const handlePenDataChange = (penId: string, field: 'totalBirds' | 'totalWeight', value: string) => {
    const numValue = parseFloat(value) || 0
    
    setPerformanceData(prev => ({
      ...prev,
      pens: prev.pens.map(pen => 
        pen.id === penId 
          ? { ...pen, [field]: numValue }
          : pen
      )
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Here you would save the performance data to your database
      console.log('Saving performance data:', performanceData)
      onSave?.(performanceData)
      alert('Performance data saved successfully!')
    } catch (error) {
      console.error('Error saving performance data:', error)
      alert('Failed to save performance data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Performance Calculations
          </CardTitle>
          <CardDescription>
            Calculate ALW (Average Live Weight), ADG (Average Daily Gain), and FCR (Feed Conversion Ratio)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Number of Pens Input */}
          <div className="space-y-2">
            <Label htmlFor="numberOfPens">Number of Pens</Label>
            <Input
              id="numberOfPens"
              type="number"
              min="0"
              value={performanceData.numberOfPens}
              onChange={(e) => handleNumberOfPensChange(e.target.value)}
              placeholder="Enter number of pens"
            />
          </div>

          {/* Pen Data Inputs */}
          {performanceData.pens.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pen Data</h3>
              <div className="grid gap-4">
                {performanceData.pens.map((pen, index) => (
                  <Card key={pen.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`birds-${pen.id}`}>Total Birds (Pen {index + 1})</Label>
                        <Input
                          id={`birds-${pen.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={pen.totalBirds}
                          onChange={(e) => handlePenDataChange(pen.id, 'totalBirds', e.target.value)}
                          placeholder="Enter total birds"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`weight-${pen.id}`}>Total Weight (kg)</Label>
                        <Input
                          id={`weight-${pen.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={pen.totalWeight}
                          onChange={(e) => handlePenDataChange(pen.id, 'totalWeight', e.target.value)}
                          placeholder="Enter total weight"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Calculation Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ALW (Average Live Weight)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {performanceData.alw.toFixed(2)} kg
                </div>
                <p className="text-xs text-gray-500">Average weight per bird</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ADG (Average Daily Gain)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {performanceData.adg.toFixed(2)} g/day
                </div>
                <p className="text-xs text-gray-500">Daily weight gain per bird</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">FCR (Feed Conversion Ratio)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {performanceData.fcr.toFixed(2)}
                </div>
                <p className="text-xs text-gray-500">Feed efficiency ratio</p>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Performance Data'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

