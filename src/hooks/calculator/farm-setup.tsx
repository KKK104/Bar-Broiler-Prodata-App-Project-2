"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Save, RotateCcw } from "lucide-react"
import type { FarmData } from "@/types/calculator"

interface FarmSetupProps {
  farmData: FarmData
  setFarmData: (data: FarmData) => void
  onSave?: (data: FarmData) => Promise<{ success: boolean; error?: string }>
}

export function FarmSetup({ farmData, setFarmData, onSave }: FarmSetupProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  const handleInputChange = (field: keyof FarmData, value: string | number) => {
    const updatedData = {
      ...farmData,
      [field]: value
    }
    
    // Auto-calculate total beginning inventory
    if (['volumeDelivered', 'deadOnArrival', 'shortCount', 'reject'].includes(field)) {
      const volumeDelivered = updatedData.volumeDelivered || 0
      const deadOnArrival = updatedData.deadOnArrival || 0
      const shortCount = updatedData.shortCount || 0
      const reject = updatedData.reject || 0
      updatedData.totalBegInv = volumeDelivered - deadOnArrival - shortCount - reject
    }
    
    setFarmData(updatedData)
  }

  const handleSave = async () => {
    if (!onSave) return

    // Validate required fields
    if (farmData.volumeDelivered === undefined || farmData.volumeDelivered === null) {
      setSaveMessage("❌ Please enter Volume Delivered")
      setTimeout(() => setSaveMessage(""), 3000)
      return
    }
    
    if (farmData.initialGrams === undefined || farmData.initialGrams === null) {
      setSaveMessage("❌ Please enter Initial Weight")
      setTimeout(() => setSaveMessage(""), 3000)
      return
    }
    
    if (farmData.building === undefined || farmData.building === null) {
      setSaveMessage("❌ Please enter Building Number")
      setTimeout(() => setSaveMessage(""), 3000)
      return
    }

    setIsSaving(true)
    setSaveMessage("")

    try {
      const result = await onSave(farmData)
      if (result.success) {
        setSaveMessage("✅ Farm data saved successfully!")
      } else {
        setSaveMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setSaveMessage("❌ Failed to save farm data")
    } finally {
      setIsSaving(false)
      setTimeout(() => setSaveMessage(""), 3000)
    }
  }

  const resetForm = () => {
    setFarmData({
      volumeDelivered: undefined,
      deadOnArrival: undefined,
      shortCount: undefined,
      reject: undefined,
      totalBegInv: undefined,
      initialGrams: undefined,
      building: undefined,
      drNo: "",
      docSource: "",
      feeds: "",
      batchStartDate: new Date().toISOString().split('T')[0],
      targetWeight: undefined,
      targetAge: undefined
    })
    setSaveMessage("🔄 Form reset to empty values")
    setTimeout(() => setSaveMessage(""), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Farm Batch Setup
          </CardTitle>
          <CardDescription>
            Configure initial parameters for your broiler batch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Batch Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="building">Building Number</Label>
              <Input
                id="building"
                type="number"
                value={farmData.building || ''}
                onChange={(e) => handleInputChange('building', e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="drNo">DR Number</Label>
              <Input
                id="drNo"
                value={farmData.drNo}
                onChange={(e) => handleInputChange('drNo', e.target.value)}
                placeholder="67734/67733"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchStartDate">Batch Start Date</Label>
              <Input
                id="batchStartDate"
                type="date"
                value={farmData.batchStartDate}
                onChange={(e) => handleInputChange('batchStartDate', e.target.value)}
              />
            </div>
          </div>

          {/* Volume and Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volumeDelivered">Total Delivered</Label>
              <Input
                id="volumeDelivered"
                type="number"
                value={farmData.volumeDelivered || ''}
                onChange={(e) => handleInputChange('volumeDelivered', e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="36720"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadOnArrival">Dead on Arrival</Label>
              <Input
                id="deadOnArrival"
                type="number"
                value={farmData.deadOnArrival || ''}
                onChange={(e) => handleInputChange('deadOnArrival', e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="56"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortCount">Short Count</Label>
              <Input
                id="shortCount"
                type="number"
                value={farmData.shortCount || ''}
                onChange={(e) => handleInputChange('shortCount', e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reject">Reject</Label>
              <Input
                id="reject"
                type="number"
                value={farmData.reject || ''}
                onChange={(e) => handleInputChange('reject', e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="138"
              />
            </div>
          </div>

          {/* Calculated Total Beginning Inventory */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <Label className="text-lg font-semibold text-blue-800">
              Total Beginning Inventory
            </Label>
            <div className="text-3xl font-bold text-blue-600">
              {farmData.totalBegInv?.toLocaleString() || '0'}
            </div>
            <p className="text-sm text-blue-600">
              {farmData.volumeDelivered || 0} - {farmData.deadOnArrival || 0} - {farmData.shortCount || 0} - {farmData.reject || 0} = {farmData.totalBegInv || 0}
            </p>
          </div>

          {/* Initial Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialGrams">Initial Weight (grams)</Label>
              <Input
                id="initialGrams"
                type="number"
                step="0.1"
                value={farmData.initialGrams || ''}
                onChange={(e) => handleInputChange('initialGrams', e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="40.6"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetWeight">Target Weight (kg)</Label>
              <Input
                id="targetWeight"
                type="number"
                step="0.1"
                value={farmData.targetWeight || ''}
                onChange={(e) => handleInputChange('targetWeight', e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="2.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAge">Target Age (days)</Label>
              <Input
                id="targetAge"
                type="number"
                value={farmData.targetAge || ''}
                onChange={(e) => handleInputChange('targetAge', e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder="35"
              />
            </div>
          </div>

          {/* Sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="docSource">DOC Source</Label>
              <Input
                id="docSource"
                value={farmData.docSource}
                onChange={(e) => handleInputChange('docSource', e.target.value)}
                placeholder="SUSTAMINA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feeds">Feed Source</Label>
              <Input
                id="feeds"
                value={farmData.feeds}
                onChange={(e) => handleInputChange('feeds', e.target.value)}
                placeholder="PHILMICO"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Farm Setup
                </div>
              )}
            </Button>

            <Button 
              onClick={resetForm} 
              variant="outline"
              disabled={isSaving}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Form
            </Button>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className={`p-3 rounded-lg text-center font-medium ${
              saveMessage.includes('❌') || saveMessage.includes('Error') || saveMessage.includes('Failed')
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
            }`}>
              {saveMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {farmData.building}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Building</div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {farmData.totalBegInv.toLocaleString()}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Birds</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {farmData.initialGrams}g
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Initial Weight</div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {farmData.targetAge || 0} days
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Target Age</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}