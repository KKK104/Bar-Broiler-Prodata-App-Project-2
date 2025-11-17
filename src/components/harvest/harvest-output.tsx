'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/calculator/use-toast'
import { ToastTitle, ToastDescription } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { HarvestInput, HarvestOutput, HarvestPerformance, DailyRecord, CostInputData } from '@/types/calculator'
import { BarChart3, DollarSign, TrendingUp, Calculator, RefreshCw } from 'lucide-react'

interface HarvestOutputProps {
  buildingId: string
  farmId: string
  cycleNumber: number
}

export function HarvestOutputComponent({ buildingId, farmId, cycleNumber }: HarvestOutputProps) {
  const [harvestInputs, setHarvestInputs] = useState<HarvestInput[]>([])
  const [harvestOutput, setHarvestOutput] = useState<HarvestOutput | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchHarvestData()
  }, [buildingId, cycleNumber])

  const fetchHarvestData = async () => {
    setIsLoading(true)
    try {
      // Fetch harvest inputs
      const { data: inputs, error: inputsError } = await supabase
        .from('harvest_inputs')
        .select('*')
        .eq('building_id', buildingId)
        .eq('cycle_number', cycleNumber)
        .order('harvest_date', { ascending: false })

      if (inputsError) throw inputsError
      setHarvestInputs(inputs || [])

      // Fetch existing harvest output
      const { data: output, error: outputError } = await supabase
        .from('harvest_outputs')
        .select('*')
        .eq('building_id', buildingId)
        .eq('cycle_number', cycleNumber)
        .single()

      if (outputError && outputError.code !== 'PGRST116') throw outputError
      if (output) {
        // Transform snake_case to camelCase for display
        const transformedOutput = {
          id: output.id,
          buildingId: output.building_id,
          farmId: output.farm_id,
          cycleNumber: output.cycle_number,
          harvestInputs: output.harvest_inputs,
          finalALW: output.final_alw,
          totalRevenuePerBuyer: output.total_revenue_per_buyer,
          grandTotalRevenue: output.grand_total_revenue,
          harvestRecoveryPercent: output.harvest_recovery_percent,
          totalMortality: output.total_mortality,
          averageMortalityRate: output.average_mortality_rate,
          avgWeight: output.avg_weight,
          adg: output.adg,
          fcr: output.fcr,
          grossIncome: output.gross_income,
          netIncome: output.net_income,
          createdAt: output.created_at,
          updatedAt: output.updated_at
        }
        setHarvestOutput(transformedOutput)
      }

    } catch (error: any) {
      console.error('Error fetching harvest data:', error)
      toast({
        children: (
          <div>
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>Failed to load harvest data</ToastDescription>
          </div>
        ),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculatePerformance = async () => {
    if (harvestInputs.length === 0) {
      toast({
        children: (
          <div>
            <ToastTitle>No Data</ToastTitle>
            <ToastDescription>No harvest inputs available for calculation</ToastDescription>
          </div>
        ),
        variant: "destructive"
      })
      return
    }

    setIsCalculating(true)
    try {
      // Get daily records for calculations
      const { data: dailyRecords, error: dailyError } = await supabase
        .from('daily_records')
        .select('*')
        .eq('building_id', buildingId)
        .order('date', { ascending: true })

      if (dailyError) throw dailyError

      // Get cost data
      const { data: costData, error: costError } = await supabase
        .from('cost_inputs')
        .select('*')
        .eq('building_id', buildingId)
        .eq('cycle_number', cycleNumber)
        .single()

      if (costError && costError.code !== 'PGRST116') {
        console.warn('No cost data found for performance calculation')
      }

      // Calculate totals from harvest inputs
      const totalHarvestBirds = harvestInputs.reduce((sum, h) => sum + h.totalBirds, 0)
      const totalHarvestWeight = harvestInputs.reduce((sum, h) => sum + h.totalWeight, 0)
      const finalALW = totalHarvestBirds > 0 ? totalHarvestWeight / totalHarvestBirds : 0

      // Calculate revenue by buyer
      const totalRevenuePerBuyer: Record<string, number> = {}
      harvestInputs.forEach(harvest => {
        const revenue = harvest.totalWeight * harvest.pricePerKilogram
        if (totalRevenuePerBuyer[harvest.buyerName]) {
          totalRevenuePerBuyer[harvest.buyerName] += revenue
        } else {
          totalRevenuePerBuyer[harvest.buyerName] = revenue
        }
      })

      const grandTotalRevenue = Object.values(totalRevenuePerBuyer).reduce((sum, revenue) => sum + revenue, 0)

      // Calculate performance metrics from daily records
      const latestRecord = dailyRecords?.[dailyRecords.length - 1]
      const firstRecord = dailyRecords?.[0]
      
      let totalFeedsConsumed = 0
      let totalMortality = 0
      let averageMortalityRate = 0
      let adg = 0
      let fcr = 0
      let harvestRecoveryPercent = 0

      if (latestRecord && firstRecord) {
        totalFeedsConsumed = latestRecord.cumulative_feeds || 0
        totalMortality = latestRecord.cumulative_mortality || 0
        averageMortalityRate = latestRecord.mortality_percent || 0
        
        // Calculate ADG (Average Daily Gain)
        const cycleLength = latestRecord.age - firstRecord.age
        if (cycleLength > 0) {
          adg = finalALW * 1000 / cycleLength // Convert to grams per day
        }

        // Calculate FCR (Feed Conversion Ratio)
        if (totalHarvestWeight > 0) {
          fcr = totalFeedsConsumed / totalHarvestWeight
        }

        // Calculate harvest recovery percentage
        const initialBirds = firstRecord.ending_heads + totalMortality
        if (initialBirds > 0) {
          harvestRecoveryPercent = (totalHarvestBirds / initialBirds) * 100
        }
      }

      // Calculate income
      const grossIncome = grandTotalRevenue
      const totalCosts = costData?.summary?.totalExpenses || 0
      const netIncome = grossIncome - totalCosts

      // Create harvest output record
      const harvestOutputData = {
        building_id: buildingId,
        farm_id: farmId,
        cycle_number: cycleNumber,
        harvest_inputs: harvestInputs,
        final_alw: finalALW,
        total_revenue_per_buyer: totalRevenuePerBuyer,
        grand_total_revenue: grandTotalRevenue,
        harvest_recovery_percent: harvestRecoveryPercent,
        total_mortality: totalMortality,
        average_mortality_rate: averageMortalityRate,
        avg_weight: finalALW,
        adg,
        fcr,
        gross_income: grossIncome,
        net_income: netIncome
      }

      // Save to database
      const { data, error } = await supabase
        .from('harvest_outputs')
        .upsert(harvestOutputData, { 
          onConflict: 'building_id,cycle_number'
        })
        .select()
        .single()

      if (error) throw error

      // Transform snake_case to camelCase for display
      const transformedData = {
        id: data.id,
        buildingId: data.building_id,
        farmId: data.farm_id,
        cycleNumber: data.cycle_number,
        harvestInputs: data.harvest_inputs,
        finalALW: data.final_alw,
        totalRevenuePerBuyer: data.total_revenue_per_buyer,
        grandTotalRevenue: data.grand_total_revenue,
        harvestRecoveryPercent: data.harvest_recovery_percent,
        totalMortality: data.total_mortality,
        averageMortalityRate: data.average_mortality_rate,
        avgWeight: data.avg_weight,
        adg: data.adg,
        fcr: data.fcr,
        grossIncome: data.gross_income,
        netIncome: data.net_income,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
      setHarvestOutput(transformedData)
      toast({
        children: (
          <div>
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Harvest performance calculated successfully!</ToastDescription>
          </div>
        )
      })

    } catch (error: any) {
      console.error('Error calculating performance:', error)
      toast({
        children: (
          <div>
            <ToastTitle>Error</ToastTitle>
            <ToastDescription>{error.message || "Failed to calculate harvest performance"}</ToastDescription>
          </div>
        ),
        variant: "destructive"
      })
    } finally {
      setIsCalculating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 sm:p-8">
        <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mr-2" />
        <span className="text-sm sm:text-base">Loading harvest data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Calculate Button */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Harvest Output & Performance</h2>
        <Button onClick={calculatePerformance} disabled={isCalculating || harvestInputs.length === 0} className="w-full sm:w-auto">
          <Calculator className="w-4 h-4 mr-2" />
          {isCalculating ? "Calculating..." : "Calculate Performance"}
        </Button>
      </div>

      {/* Harvest Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-base sm:text-lg">Harvest Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {harvestInputs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm sm:text-base">No harvest inputs recorded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Total Trucks</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{harvestInputs.length}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Total Birds</p>
                <p className="text-lg sm:text-2xl font-bold text-green-900 dark:text-green-100">
                  {harvestInputs.reduce((sum, h) => sum + h.totalBirds, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Total Weight</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {harvestInputs.reduce((sum, h) => sum + h.totalWeight, 0).toLocaleString()} kg
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-yellow-600 dark:text-yellow-400">Final ALW</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {harvestInputs.length > 0 ? 
                    (harvestInputs.reduce((sum, h) => sum + h.totalWeight, 0) / 
                     harvestInputs.reduce((sum, h) => sum + h.totalBirds, 0)).toFixed(2) : '0.00'} kg
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Buyer */}
      {harvestInputs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-base sm:text-lg">Revenue by Buyer</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(
                harvestInputs.reduce((acc, harvest) => {
                  const revenue = harvest.totalWeight * harvest.pricePerKilogram
                  if (acc[harvest.buyerName]) {
                    acc[harvest.buyerName] += revenue
                  } else {
                    acc[harvest.buyerName] = revenue
                  }
                  return acc
                }, {} as Record<string, number>)
              ).map(([buyer, revenue]) => (
                <div key={buyer} className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="font-medium truncate text-sm sm:text-base dark:text-white">{buyer}</span>
                  <span className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                    ₱{revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              <div className="border-t dark:border-gray-700 pt-3">
                <div className="flex flex-col space-y-1 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                  <span className="text-base sm:text-lg font-bold dark:text-white">Grand Total Revenue</span>
                  <span className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                    ₱{harvestInputs.reduce((sum, h) => sum + (h.totalWeight * h.pricePerKilogram), 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Performance */}
      {harvestOutput && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-base sm:text-lg">Final Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Harvest Recovery</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{harvestOutput.harvestRecoveryPercent.toFixed(1)}%</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">Total Mortality</p>
                <p className="text-lg sm:text-2xl font-bold text-red-900 dark:text-red-100">{harvestOutput.totalMortality.toLocaleString()}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">Avg Mortality Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-900 dark:text-orange-100">{harvestOutput.averageMortalityRate.toFixed(2)}%</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Final FCR</p>
                <p className="text-lg sm:text-2xl font-bold text-green-900 dark:text-green-100">{harvestOutput.fcr.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-yellow-600 dark:text-yellow-400">Final ADG</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-900 dark:text-yellow-100">{harvestOutput.adg.toFixed(1)}g</p>
              </div>
            </div>

            {/* Income Summary */}
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-green-100 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-green-700">Gross Income</p>
                <p className="text-xl sm:text-3xl font-bold text-green-800">
                  ₱{harvestOutput.grossIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-blue-100 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-blue-700">Net Income</p>
                <p className={`text-xl sm:text-3xl font-bold ${harvestOutput.netIncome >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  ₱{harvestOutput.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 