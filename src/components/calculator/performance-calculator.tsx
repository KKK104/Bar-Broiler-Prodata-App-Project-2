"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Calculator, Save, History } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Pen {
  id: string
  totalBirds: number
  totalWeight: number // in grams
  alw: number // in grams
}

interface ALWData {
  currentAge: number
  numberOfPens: number
  pens: Pen[]
  finalALW: number // average ALW across all pens
}

interface ADGData {
  currentAge: number
  previousAge: number
  currentALW: number
  previousALW: number
  netDays: number
  adg: number
}

interface FeedConsumptionData {
  currentAge: number
  feedsGiven: number // in bags
  feedConsumption: number // in kg
}

interface FCRData {
  currentAge: number
  feedConsumption: number // from feed consumption section
  remainingBirds: number
  currentALW: number // from ALW section
  fcr: number
}

interface PerformanceCalculation {
  id: string
  calculation_type: 'alw' | 'adg' | 'fcr' | 'feed_consumption'
  calculation_data: any
  result_value: number
  calculation_date: string
}

interface PerformanceCalculatorProps {
  farmId?: string
  buildingId?: string
}

export function PerformanceCalculator({ farmId, buildingId }: PerformanceCalculatorProps) {
  const [alwData, setAlwData] = useState<ALWData>({
    currentAge: 0,
    numberOfPens: 0,
    pens: [],
    finalALW: 0
  })

  const [adgData, setAdgData] = useState<ADGData>({
    currentAge: 0,
    previousAge: 0,
    currentALW: 0,
    previousALW: 0,
    netDays: 0,
    adg: 0
  })

  const [feedConsumptionData, setFeedConsumptionData] = useState<FeedConsumptionData>({
    currentAge: 0,
    feedsGiven: 0,
    feedConsumption: 0
  })

  const [fcrData, setFcrData] = useState<FCRData>({
    currentAge: 0,
    feedConsumption: 0,
    remainingBirds: 0,
    currentALW: 0,
    fcr: 0
  })

  const [savedCalculations, setSavedCalculations] = useState<PerformanceCalculation[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load existing performance calculations
  const loadSavedCalculations = async () => {
    if (!farmId || !buildingId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('performance_calculations')
        .select('*')
        .eq('farm_id', farmId)
        .eq('building_id', buildingId)
        .order('calculation_date', { ascending: false })

      if (error) throw error
      setSavedCalculations(data || [])
    } catch (error) {
      console.error('Error loading performance calculations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Save ALW calculation
  const saveALWCalculation = async () => {
    if (!farmId || !buildingId) {
      alert('Farm ID or Building ID is not available')
      return
    }

    if (alwData.finalALW === 0) {
      alert('Please calculate ALW first before saving')
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('performance_calculations')
        .insert([{
          farm_id: farmId,
          building_id: buildingId,
          calculation_type: 'alw',
          calculation_data: {
            currentAge: alwData.currentAge,
            numberOfPens: alwData.numberOfPens,
            pens: alwData.pens
          },
          result_value: alwData.finalALW
        }])
        .select()

      if (error) throw error
      alert('ALW calculation saved successfully!')
      loadSavedCalculations()
    } catch (error) {
      console.error('Error saving ALW calculation:', error)
      alert('Failed to save ALW calculation')
    } finally {
      setSaving(false)
    }
  }

  // Save ADG calculation
  const saveADGCalculation = async () => {
    if (!farmId || !buildingId) {
      alert('Farm ID or Building ID is not available')
      return
    }

    if (adgData.adg === 0) {
      alert('Please calculate ADG first before saving')
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('performance_calculations')
        .insert([{
          farm_id: farmId,
          building_id: buildingId,
          calculation_type: 'adg',
          calculation_data: {
            currentAge: adgData.currentAge,
            previousAge: adgData.previousAge,
            currentALW: adgData.currentALW,
            previousALW: adgData.previousALW,
            netDays: adgData.netDays
          },
          result_value: adgData.adg
        }])
        .select()

      if (error) throw error
      alert('ADG calculation saved successfully!')
      loadSavedCalculations()
    } catch (error) {
      console.error('Error saving ADG calculation:', error)
      alert('Failed to save ADG calculation')
    } finally {
      setSaving(false)
    }
  }

  // Save Feed Consumption calculation
  const saveFeedConsumptionCalculation = async () => {
    if (!farmId || !buildingId) {
      alert('Farm ID or Building ID is not available')
      return
    }

    if (feedConsumptionData.feedConsumption === 0) {
      alert('Please calculate Feed Consumption first before saving')
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('performance_calculations')
        .insert([{
          farm_id: farmId,
          building_id: buildingId,
          calculation_type: 'feed_consumption',
          calculation_data: {
            currentAge: feedConsumptionData.currentAge,
            feedsGiven: feedConsumptionData.feedsGiven
          },
          result_value: feedConsumptionData.feedConsumption
        }])
        .select()

      if (error) throw error
      alert('Feed Consumption calculation saved successfully!')
      loadSavedCalculations()
    } catch (error) {
      console.error('Error saving Feed Consumption calculation:', error)
      alert('Failed to save Feed Consumption calculation')
    } finally {
      setSaving(false)
    }
  }

  // Save FCR calculation
  const saveFCRCalculation = async () => {
    if (!farmId || !buildingId) {
      alert('Farm ID or Building ID is not available')
      return
    }

    if (fcrData.fcr === 0) {
      alert('Please calculate FCR first before saving')
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('performance_calculations')
        .insert([{
          farm_id: farmId,
          building_id: buildingId,
          calculation_type: 'fcr',
          calculation_data: {
            currentAge: fcrData.currentAge,
            feedConsumption: fcrData.feedConsumption,
            remainingBirds: fcrData.remainingBirds,
            currentALW: fcrData.currentALW
          },
          result_value: fcrData.fcr
        }])
        .select()

      if (error) throw error
      alert('FCR calculation saved successfully!')
      loadSavedCalculations()
    } catch (error) {
      console.error('Error saving FCR calculation:', error)
      alert('Failed to save FCR calculation')
    } finally {
      setSaving(false)
    }
  }

  // Load calculations on component mount
  useEffect(() => {
    loadSavedCalculations()
  }, [farmId, buildingId])

  // ALW Calculation Handlers
  const handleALWCurrentAgeChange = (value: string) => {
    const age = parseInt(value) || 0
    setAlwData(prev => ({ ...prev, currentAge: age }))
  }

  const handleNumberOfPensChange = (value: string) => {
    const num = parseInt(value) || 0
    
    // Create pens array based on number of pens
    const newPens: Pen[] = []
    for (let i = 0; i < num; i++) {
      newPens.push({
        id: `pen-${i + 1}`,
        totalBirds: 0,
        totalWeight: 0,
        alw: 0
      })
    }
    
    setAlwData(prev => ({ 
      ...prev, 
      numberOfPens: num,
      pens: newPens
    }))
  }

  const handlePenDataChange = (penId: string, field: 'totalBirds' | 'totalWeight', value: string) => {
    const numValue = parseFloat(value) || 0
    
    setAlwData(prev => ({
      ...prev,
      pens: prev.pens.map(pen => {
        if (pen.id === penId) {
          const updatedPen = {
            ...pen,
            [field]: numValue
          }
          // Calculate ALW for this pen (ALW = Total Weight / Total Birds)
          updatedPen.alw = updatedPen.totalBirds > 0 ? updatedPen.totalWeight / updatedPen.totalBirds : 0
          return updatedPen
        }
        return pen
      })
    }))
  }

  const calculateALW = () => {
    // Calculate Final ALW as mean of all pen ALWs
    const validPens = alwData.pens.filter(pen => pen.alw > 0)
    const finalALW = validPens.length > 0 
      ? validPens.reduce((sum, pen) => sum + pen.alw, 0) / validPens.length 
      : 0

    setAlwData(prev => ({
      ...prev,
      finalALW
    }))
  }

  const addPen = () => {
    const newPen: Pen = {
      id: `pen-${alwData.pens.length + 1}`,
      totalBirds: 0,
      totalWeight: 0,
      alw: 0
    }
    setAlwData(prev => ({
      ...prev,
      pens: [...prev.pens, newPen],
      numberOfPens: prev.pens.length + 1
    }))
  }

  const removePen = (penId: string) => {
    setAlwData(prev => ({
      ...prev,
      pens: prev.pens.filter(pen => pen.id !== penId),
      numberOfPens: prev.pens.length - 1
    }))
  }

  // ADG Calculation Handlers
  const handleADGChange = (field: keyof ADGData, value: string) => {
    const numValue = parseFloat(value) || 0
    
    setAdgData(prev => {
      const updated = { ...prev, [field]: numValue }
      
      // Calculate Net Days
      if (field === 'currentAge' || field === 'previousAge') {
        updated.netDays = updated.currentAge - updated.previousAge
      }
      
      // Calculate ADG: (ALW Current - ALW Previous) / Net Days
      if (updated.netDays > 0) {
        updated.adg = (updated.currentALW - updated.previousALW) / updated.netDays
      } else {
        updated.adg = 0
      }
      
      return updated
    })
  }

  // Feed Consumption Calculation Handlers
  const handleFeedConsumptionChange = (field: keyof FeedConsumptionData, value: string) => {
    const numValue = parseFloat(value) || 0
    
    setFeedConsumptionData(prev => {
      const updated = { ...prev, [field]: numValue }
      
      // Calculate Feed Consumption: Feeds Given × 50
      if (field === 'feedsGiven') {
        updated.feedConsumption = updated.feedsGiven * 50
      }
      
      return updated
    })
  }

  // FCR Calculation Handlers
  const handleFCRChange = (field: keyof FCRData, value: string) => {
    const numValue = parseFloat(value) || 0
    
    setFcrData(prev => {
      const updated = { ...prev, [field]: numValue }
      
      // Calculate FCR: (Feed Consumption / Remaining Birds) / ALW
      if (updated.remainingBirds > 0 && updated.currentALW > 0) {
        const feedPerBird = updated.feedConsumption / updated.remainingBirds
        updated.fcr = feedPerBird / (updated.currentALW / 1000) // Convert grams to kg for calculation
      } else {
        updated.fcr = 0
      }
      
      return updated
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Performance Calculator
          </CardTitle>
          <CardDescription>
            Calculate ALW (Average Live Weight), ADG (Average Daily Gain), and FCR (Feed Conversion Ratio)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="alw" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="alw">ALW</TabsTrigger>
              <TabsTrigger value="adg">ADG</TabsTrigger>
              <TabsTrigger value="feed">Feed Consumption</TabsTrigger>
              <TabsTrigger value="fcr">FCR</TabsTrigger>
            </TabsList>

            <TabsContent value="alw" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ALW (Average Live Weight)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="alwCurrentAge">Current Age (Day)</Label>
                    <Input
                      id="alwCurrentAge"
                      type="number"
                      value={alwData.currentAge || ''}
                      onChange={(e) => handleALWCurrentAgeChange(e.target.value)}
                      placeholder="Enter current day (e.g., 7)"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfPens">Pen No.</Label>
                    <Input
                      id="numberOfPens"
                      type="number"
                      value={alwData.numberOfPens || ''}
                      onChange={(e) => handleNumberOfPensChange(e.target.value)}
                      placeholder="Enter total pens (e.g., 4)"
                      min="0"
                    />
                  </div>
                </div>

                {alwData.pens.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      {alwData.pens.map((pen, index) => (
                        <Card key={pen.id} className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Pen {index + 1}</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removePen(pen.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor={`weight-${pen.id}`}>Total Weight (grams)</Label>
                              <Input
                                id={`weight-${pen.id}`}
                                type="number"
                                value={pen.totalWeight || ''}
                                onChange={(e) => handlePenDataChange(pen.id, 'totalWeight', e.target.value)}
                                placeholder="Enter total weight"
                                min="0"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`birds-${pen.id}`}>Input Total Birds</Label>
                              <Input
                                id={`birds-${pen.id}`}
                                type="number"
                                value={pen.totalBirds || ''}
                                onChange={(e) => handlePenDataChange(pen.id, 'totalBirds', e.target.value)}
                                placeholder="Enter total birds"
                                min="0"
                              />
                            </div>
                            <div>
                              <Label>PEN {index + 1} ALW</Label>
                              <div className="p-2 bg-gray-50 rounded-md text-sm font-medium">
                                {pen.alw.toFixed(2)} grams
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Formula: ALW = Total Weight / Total Birds
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={calculateALW} className="flex-1">
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate Final ALW
                      </Button>
                      <Button 
                        onClick={saveALWCalculation} 
                        disabled={saving || alwData.finalALW === 0}
                        variant="outline"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save ALW'}
                      </Button>
                    </div>

                    {alwData.finalALW > 0 && (
                      <Card className="p-4 bg-blue-50">
                        <h3 className="font-semibold text-blue-900 mb-2">Final ALW Result</h3>
                        <div className="text-lg font-bold text-blue-600">
                          FINAL ALW (grams): {alwData.finalALW.toFixed(2)} grams
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Formula: ALW = (Pen 1 ALW + Pen 2 ALW + Pen 3 ALW + Pen 4 ALW) / Number of pens
                        </p>
                      </Card>
                    )}
                  </div>
                )}

                <div className="flex items-end">
                  <Button onClick={addPen} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pen
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="adg" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">ADG (Average Daily Gain)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adgCurrentAge">Current Age (Day)</Label>
                    <Input
                      id="adgCurrentAge"
                      type="number"
                      value={adgData.currentAge || ''}
                      onChange={(e) => handleADGChange('currentAge', e.target.value)}
                      placeholder="Enter current age (e.g., 7)"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adgPreviousAge">Age (Day) of Last ADG Computation</Label>
                    <Input
                      id="adgPreviousAge"
                      type="number"
                      value={adgData.previousAge || ''}
                      onChange={(e) => handleADGChange('previousAge', e.target.value)}
                      placeholder="Enter previous age (e.g., 5)"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentALW">ALW Current</Label>
                    <Input
                      id="currentALW"
                      type="number"
                      step="0.01"
                      value={adgData.currentALW || ''}
                      onChange={(e) => handleADGChange('currentALW', e.target.value)}
                      placeholder="ALW of current day (e.g., day 7)"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="previousALW">ALW Previous</Label>
                    <Input
                      id="previousALW"
                      type="number"
                      step="0.01"
                      value={adgData.previousALW || ''}
                      onChange={(e) => handleADGChange('previousALW', e.target.value)}
                      placeholder="ALW of previous day (e.g., day 5)"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Net Days</Label>
                    <div className="p-2 bg-gray-50 rounded-md text-sm font-medium">
                      {adgData.netDays} days
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Number of days between current and previous (Day {adgData.currentAge} - {adgData.previousAge} = {adgData.netDays} days)
                    </p>
                  </div>
                  <div>
                    <Label>ADG</Label>
                    <div className="p-2 bg-gray-50 rounded-md text-sm font-medium">
                      {adgData.adg.toFixed(4)} grams/day
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Formula: ADG = (ALW Current - ALW Previous) / Net Days
                    </p>
                  </div>
                </div>

                {adgData.adg > 0 && (
                  <Card className="p-4 bg-green-50">
                    <h4 className="font-semibold text-green-900 mb-2">ADG Result</h4>
                    <div className="text-lg font-bold text-green-600">
                      ADG (Day {adgData.currentAge}): {adgData.adg.toFixed(4)} grams/day
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Formula: ADG = (ALW Current - ALW Previous) / Net Days or Day current - Day previous
                    </p>
                    <Button 
                      onClick={saveADGCalculation} 
                      disabled={saving}
                      className="mt-3 w-full"
                      variant="outline"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save ADG Calculation'}
                    </Button>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="feed" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Feed Consumption</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="feedCurrentAge">Current Age (Day)</Label>
                    <Input
                      id="feedCurrentAge"
                      type="number"
                      value={feedConsumptionData.currentAge || ''}
                      onChange={(e) => handleFeedConsumptionChange('currentAge', e.target.value)}
                      placeholder="Enter current age (e.g., 7)"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedsGiven">Feeds Given (Bags)</Label>
                    <Input
                      id="feedsGiven"
                      type="number"
                      step="0.01"
                      value={feedConsumptionData.feedsGiven || ''}
                      onChange={(e) => handleFeedConsumptionChange('feedsGiven', e.target.value)}
                      placeholder="Current number of bags at day 7"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Feed Consumption (kgs)</Label>
                    <div className="p-2 bg-gray-50 rounded-md text-sm font-medium">
                      {feedConsumptionData.feedConsumption.toFixed(2)} kg
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Formula: Feeds Given at day 7 × 50
                    </p>
                  </div>
                </div>

                {feedConsumptionData.feedConsumption > 0 && (
                  <Card className="p-4 bg-purple-50">
                    <h4 className="font-semibold text-purple-900 mb-2">Feed Consumption Result</h4>
                    <div className="text-lg font-bold text-purple-600">
                      Feed Consumption (Day {feedConsumptionData.currentAge}): {feedConsumptionData.feedConsumption.toFixed(2)} kg
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Formula: Feeds Given at day {feedConsumptionData.currentAge} × 50
                    </p>
                    <Button 
                      onClick={saveFeedConsumptionCalculation} 
                      disabled={saving}
                      className="mt-3 w-full"
                      variant="outline"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Feed Consumption'}
                    </Button>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="fcr" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">FCR (Feed Conversion Ratio)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fcrCurrentAge">Current Age (Day)</Label>
                    <Input
                      id="fcrCurrentAge"
                      type="number"
                      value={fcrData.currentAge || ''}
                      onChange={(e) => handleFCRChange('currentAge', e.target.value)}
                      placeholder="Enter current age (e.g., 7)"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feedConsumption">Feed Consumption (kgs)</Label>
                    <Input
                      id="feedConsumption"
                      type="number"
                      step="0.01"
                      value={fcrData.feedConsumption || ''}
                      onChange={(e) => handleFCRChange('feedConsumption', e.target.value)}
                      placeholder="From Feed Consumption section"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="remainingBirds">No. of Birds Remaining</Label>
                    <Input
                      id="remainingBirds"
                      type="number"
                      value={fcrData.remainingBirds || ''}
                      onChange={(e) => handleFCRChange('remainingBirds', e.target.value)}
                      placeholder="Birds remaining at day 7"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fcrCurrentALW">ALW at Current Day</Label>
                    <Input
                      id="fcrCurrentALW"
                      type="number"
                      step="0.01"
                      value={fcrData.currentALW || ''}
                      onChange={(e) => handleFCRChange('currentALW', e.target.value)}
                      placeholder="ALW at day 7 (grams)"
                      min="0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>FCR</Label>
                    <div className="p-2 bg-gray-50 rounded-md text-sm font-medium">
                      {fcrData.fcr.toFixed(4)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Formula: FCR = (Feed Consumption (kgs) at day 7 / no. of birds remaining at day 7) / ALW at day 7
                    </p>
                  </div>
                </div>

                {fcrData.fcr > 0 && (
                  <Card className="p-4 bg-orange-50">
                    <h4 className="font-semibold text-orange-900 mb-2">FCR Result</h4>
                    <div className="text-lg font-bold text-orange-600">
                      FCR (Day {fcrData.currentAge}): {fcrData.fcr.toFixed(4)}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Formula: FCR = (Feed Consumption (kgs) at day {fcrData.currentAge} / no. of birds remaining at day {fcrData.currentAge}) / ALW at day {fcrData.currentAge}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>• Lower FCR = Better feed efficiency</p>
                      <p>• Typical FCR range: 1.5 - 2.0 for broilers</p>
                      <p>• FCR &lt; 1.8 is considered excellent</p>
                    </div>
                    <Button 
                      onClick={saveFCRCalculation} 
                      disabled={saving}
                      className="mt-3 w-full"
                      variant="outline"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save FCR Calculation'}
                    </Button>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Saved Calculations List */}
      {savedCalculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Saved Performance Calculations
            </CardTitle>
            <CardDescription>
              Previously saved calculation results for this building
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedCalculations.map((calc) => (
                <Card key={calc.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          calc.calculation_type === 'alw' ? 'bg-blue-100 text-blue-800' :
                          calc.calculation_type === 'adg' ? 'bg-green-100 text-green-800' :
                          calc.calculation_type === 'feed_consumption' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {calc.calculation_type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(calc.calculation_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">
                          Result: {calc.result_value.toFixed(4)} {
                            calc.calculation_type === 'alw' ? 'grams' :
                            calc.calculation_type === 'adg' ? 'grams/day' :
                            calc.calculation_type === 'feed_consumption' ? 'kg' :
                            ''
                          }
                        </p>
                        {calc.calculation_type === 'alw' && (
                          <p className="text-gray-600">
                            Age: {calc.calculation_data.currentAge || 'N/A'} days | 
                            Pens: {calc.calculation_data.numberOfPens || 'N/A'}
                          </p>
                        )}
                        {calc.calculation_type === 'adg' && (
                          <p className="text-gray-600">
                            Age Range: {calc.calculation_data.previousAge || 'N/A'} - {calc.calculation_data.currentAge || 'N/A'} days | 
                            Net Days: {calc.calculation_data.netDays || 'N/A'}
                          </p>
                        )}
                        {calc.calculation_type === 'feed_consumption' && (
                          <p className="text-gray-600">
                            Age: {calc.calculation_data.currentAge || 'N/A'} days | 
                            Bags Given: {calc.calculation_data.feedsGiven || 'N/A'}
                          </p>
                        )}
                        {calc.calculation_type === 'fcr' && (
                          <p className="text-gray-600">
                            Age: {calc.calculation_data.currentAge || 'N/A'} days | 
                            Remaining Birds: {calc.calculation_data.remainingBirds || 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading saved calculations...</p>
        </Card>
      )}
    </div>
  )
}
