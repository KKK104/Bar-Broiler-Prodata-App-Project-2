       "use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Download, Upload, Eye, X, Edit2, Save, XCircle, Share2, MessageCircle, Phone } from "lucide-react"
import type { FarmData, DailyRecord } from "@/types/calculator"
import * as React from "react"
import * as XLSX from 'xlsx'
import { cn } from "@/lib/utils"

const CardHeader = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
)

const CardDescription = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <p className={`text-xs text-muted-foreground ${className}`}>{children}</p>
)

interface DailyTrackingProps {
  farmData: FarmData
  dailyRecords: DailyRecord[]
  setDailyRecords: (records: DailyRecord[]) => void
  onSave?: (records?: DailyRecord[]) => Promise<void>
}

export function DailyTracking({ farmData, dailyRecords, setDailyRecords, onSave }: DailyTrackingProps) {
  const [newRecord, setNewRecord] = useState<Partial<DailyRecord>>({
    date: new Date().toISOString().split("T")[0],
    age: dailyRecords.length,
    dailyFeeds: undefined,
    feedsDelivery: undefined,
    dailyMortality: undefined,
    alw: undefined,
    remarks: "",
  })
  const [mortalityImage, setMortalityImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<number | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<DailyRecord>>({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [csvData, setCSVData] = useState<string>("")
  const [showShareMenu, setShowShareMenu] = useState(false)


  // Function to show success message
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => {
      setSuccessMessage(null)
    }, 3000) // Hide after 3 seconds
  }

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareMenu) {
        setShowShareMenu(false)
      }
    }

    if (showShareMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showShareMenu])


  // Update age and date when records change
  useEffect(() => {
    console.log('🔄 [DATE CALC] useEffect triggered with:', {
      batchStartDate: farmData.batchStartDate,
      dailyRecordsLength: dailyRecords.length
    })
    
    if (!farmData.batchStartDate) {
      console.log('❌ [DATE CALC] No batchStartDate available')
      return
    }
    
    const startDate = new Date(farmData.batchStartDate)
    
    // Find the next available date by checking existing dates
    let nextDate = new Date(startDate)
    let attempts = 0
    const maxAttempts = 365 // Prevent infinite loop
    
    // Find the next date that doesn't already exist
    while (attempts < maxAttempts) {
      const dateString = nextDate.toISOString().split("T")[0]
      const dateExists = dailyRecords.some(record => record.date === dateString)
      
      if (!dateExists) {
        break // Found a free date
      }
      
      // Move to next day
      nextDate.setDate(nextDate.getDate() + 1)
      attempts++
    }
    
    const newDateString = nextDate.toISOString().split("T")[0]
    const calculatedAge = dailyRecords.length // Age should always be the current number of records
    
    console.log('📅 [DATE CALC] Calculated new date:', newDateString, 'for age:', calculatedAge)
    console.log('📅 [DATE CALC] Existing dates:', dailyRecords.map(r => r.date))
    console.log('📅 [DATE CALC] Date calculation attempts:', attempts)
    
    setNewRecord(prev => ({
      ...prev,
      age: dailyRecords.length,
      date: newDateString
    }))
  }, [dailyRecords.length, farmData.batchStartDate])

  // Export to Excel function
  const exportToExcel = () => {
    if (dailyRecords.length === 0) {
      alert('No daily records available to export.')
      return
    }
    
    console.log('📊 [EXPORT] Exporting', dailyRecords.length, 'records to Excel')

    // Format data exactly like the Excel format shown
    const excelData = dailyRecords.map((record) => ({
      'DATE': record.date,
      'AGE': record.age,
      'DAILY FEEDS INTAKE (PER BAG)': record.dailyFeeds,
      'CUMULATIVE FEEDS': record.cumulativeFeeds,
      'FEEDS DELIVERY': record.feedsDelivery,
      'REMAINING FEEDS': record.remainingFeeds,
      'DAILY MORTALITY': record.dailyMortality,
      'CUMULATIVE MORTALITY': record.cumulativeMortality,
      '% CUM MORTALITY': `${record.mortalityPercent}%`,
      'ENDING HEADS': record.endingHeads,
      'ALW': record.alw,
      'ADG': record.adg,
      'REMARKS (IBA PANG GINAWA)': record.remarks || ''
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths for better formatting
    const colWidths = [
      { wch: 12 }, // DATE
      { wch: 6 },  // AGE
      { wch: 18 }, // DAILY FEEDS INTAKE (PER BAG)
      { wch: 15 }, // CUMULATIVE FEEDS
      { wch: 12 }, // FEEDS DELIVERY
      { wch: 15 }, // REMAINING FEEDS
      { wch: 12 }, // DAILY MORTALITY
      { wch: 18 }, // CUMULATIVE MORTALITY
      { wch: 12 }, // % CUM MORTALITY
      { wch: 12 }, // ENDING HEADS
      { wch: 8 },  // ALW
      { wch: 8 },  // ADG
      { wch: 25 }  // REMARKS
    ]
    ws['!cols'] = colWidths

    // Add some styling to the header row
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "366092" } },
      alignment: { horizontal: "center" }
    }

    // Apply header styling (first row)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (ws[cellAddress]) {
        ws[cellAddress].s = headerStyle
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Records')

    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0]
    const filename = `Daily_Records_Building_${farmData.building || 'Unknown'}_${today}.xlsx`

    // Download the file
    try {
      XLSX.writeFile(wb, filename)
      console.log('✅ [EXPORT] Excel file downloaded successfully:', filename)
    } catch (error) {
      console.error('❌ [EXPORT] Error downloading Excel file:', error)
      alert('Failed to download Excel file. Please try again.')
    }
  }

  // Generate CSV data function
  const generateCSVData = () => {
    if (dailyRecords.length === 0) {
      return ""
    }

    // CSV Headers
    const headers = [
      'DATE',
      'AGE',
      'DAILY FEEDS INTAKE (PER BAG)',
      'CUMULATIVE FEEDS',
      'FEEDS DELIVERY',
      'REMAINING FEEDS',
      'DAILY MORTALITY',
      'CUMULATIVE MORTALITY',
      '% CUM MORTALITY',
      'ENDING HEADS',
      'ALW',
      'ADG',
      'REMARKS (IBA PANG GINAWA)'
    ]

    // CSV Rows
    const rows = dailyRecords.map((record) => [
      record.date,
      record.age,
      record.dailyFeeds || '',
      record.cumulativeFeeds || '',
      record.feedsDelivery || '',
      record.remainingFeeds || '',
      record.dailyMortality || '',
      record.cumulativeMortality || '',
      record.mortalityPercent ? `${record.mortalityPercent}%` : '',
      record.endingHeads || '',
      record.alw || '',
      record.adg || '',
      record.remarks || ''
    ])

    // Combine headers and rows
    const allRows = [headers, ...rows]
    
    // Convert to CSV format
    return allRows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    ).join('\n')
  }

  // View CSV data in modal
  const viewCSVData = () => {
    if (dailyRecords.length === 0) {
      alert('No daily records available to view.')
      return
    }
    
    console.log('📊 [CSV VIEW] Generating CSV data for', dailyRecords.length, 'records')
    const csvContent = generateCSVData()
    setCSVData(csvContent)
    setShowCSVModal(true)
  }

  // Download CSV file
  const downloadCSV = () => {
    if (dailyRecords.length === 0) {
      alert('No daily records available to download.')
      return
    }

    console.log('📊 [CSV DOWNLOAD] Downloading CSV for', dailyRecords.length, 'records')
    const csvContent = generateCSVData()
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0]
    const filename = `Daily_Records_Building_${farmData.building || 'Unknown'}_${today}.csv`
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      console.log('✅ [CSV DOWNLOAD] CSV file downloaded successfully:', filename)
    } else {
      console.error('❌ [CSV DOWNLOAD] Browser does not support file download')
      alert('Your browser does not support file download. Please try a different browser.')
    }
  }

  // Copy table data to clipboard (tab-separated for better Excel compatibility)
  const copyTableToClipboard = async () => {
    if (dailyRecords.length === 0) {
      alert('No daily records available to copy.')
      return
    }

    // Create tab-separated values (TSV) which works better for Excel
    const headers = [
      'DATE',
      'AGE',
      'DAILY FEEDS INTAKE (PER BAG)',
      'CUMULATIVE FEEDS',
      'FEEDS DELIVERY',
      'REMAINING FEEDS',
      'DAILY MORTALITY',
      'CUMULATIVE MORTALITY',
      '% CUM MORTALITY',
      'ENDING HEADS',
      'ALW',
      'ADG',
      'REMARKS (IBA PANG GINAWA)'
    ]

    const rows = dailyRecords.map((record) => [
      record.date,
      record.age,
      record.dailyFeeds || '',
      record.cumulativeFeeds || '',
      record.feedsDelivery || '',
      record.remainingFeeds || '',
      record.dailyMortality || '',
      record.cumulativeMortality || '',
      record.mortalityPercent ? `${record.mortalityPercent}%` : '',
      record.endingHeads || '',
      record.alw || '',
      record.adg || '',
      record.remarks || ''
    ])

    // Combine headers and rows with tabs
    const allRows = [headers, ...rows]
    const tsvContent = allRows.map(row => row.join('\t')).join('\n')

    try {
      await navigator.clipboard.writeText(tsvContent)
      alert('Table data copied to clipboard! You can now paste it directly into Excel or Google Sheets.')
      console.log('✅ [TABLE COPY] Table data copied to clipboard as TSV')
    } catch (error) {
      console.error('❌ [TABLE COPY] Failed to copy to clipboard:', error)
      alert('Failed to copy to clipboard. Please try again or use the download option.')
    }
  }

  // Copy CSV to clipboard
  const copyCSVToClipboard = async () => {
    if (dailyRecords.length === 0) {
      alert('No daily records available to copy.')
      return
    }

    const csvContent = generateCSVData()
    try {
      await navigator.clipboard.writeText(csvContent)
      alert('CSV data copied to clipboard!')
      console.log('✅ [CSV COPY] CSV data copied to clipboard')
    } catch (error) {
      console.error('❌ [CSV COPY] Failed to copy to clipboard:', error)
      alert('Failed to copy to clipboard. Please try again or use the download option.')
    }
  }

  // Share data via different platforms
  const shareData = (platform: 'whatsapp' | 'messenger' | 'viber') => {
    if (dailyRecords.length === 0) {
      alert('No daily records available to share.')
      return
    }

    // Create a summary message
    const buildingName = farmData.building || 'Unknown'
    const recordCount = dailyRecords.length
    const dateRange = recordCount > 0 ? `${dailyRecords[0].date} to ${dailyRecords[recordCount - 1].date}` : 'N/A'
    
    const message = `🐔 Daily Records Report - Building ${buildingName}
📅 Period: ${dateRange}
📊 Total Records: ${recordCount} days

📈 Latest Data (Day ${dailyRecords[recordCount - 1]?.age || 'N/A'}):
• Daily Feeds: ${dailyRecords[recordCount - 1]?.dailyFeeds || 'N/A'} bags
• Cumulative Feeds: ${dailyRecords[recordCount - 1]?.cumulativeFeeds || 'N/A'}
• Daily Mortality: ${dailyRecords[recordCount - 1]?.dailyMortality || 'N/A'}
• Ending Heads: ${dailyRecords[recordCount - 1]?.endingHeads || 'N/A'}
• ALW: ${dailyRecords[recordCount - 1]?.alw || 'N/A'}
• ADG: ${dailyRecords[recordCount - 1]?.adg || 'N/A'}

Generated from Broiler Management App`

    const encodedMessage = encodeURIComponent(message)
    let shareUrl = ''

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedMessage}`
        break
      case 'messenger':
        shareUrl = `https://m.me/?text=${encodedMessage}`
        break
      case 'viber':
        shareUrl = `viber://forward?text=${encodedMessage}`
        break
    }

    // Open in new tab/window
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
      console.log(`✅ [SHARE] Opened ${platform} share dialog`)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setMortalityImage(result)
      setImageFile(file)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setMortalityImage(null)
    setImageFile(null)
    const fileInput = document.getElementById('mortality-image-input') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const openImageModal = (imageSrc: string) => {
    setSelectedImage(imageSrc)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  const addRecord = async () => {
    console.log('🚀 [ADD RECORD] Starting addRecord function')
    console.log('🔍 [ADD RECORD] Current newRecord:', newRecord)
    console.log('🔍 [ADD RECORD] Current dailyRecords length:', dailyRecords.length)
    console.log('🔍 [ADD RECORD] farmData.batchStartDate:', farmData.batchStartDate)
    
    // Check for duplicate date (both in UI state and database constraint)
    const existingRecord = dailyRecords.find(record => record.date === newRecord.date)
    if (existingRecord) {
      console.log('❌ [ADD RECORD] Duplicate date found in UI state:', newRecord.date)
      alert(`A record for date ${newRecord.date} already exists. Please use a different date or edit the existing record.`)
      return
    }
    
    console.log('✅ [ADD RECORD] No duplicate date found in UI state, proceeding...')

    // Validate required fields
    if (!newRecord.date || !newRecord.date.trim()) {
      alert('Please enter a valid date.')
      return
    }
    
    // Validate that numeric fields have values
    if (!newRecord.dailyFeeds || newRecord.dailyFeeds === 0) {
      alert('Please enter a value for Daily Feeds.')
      return
    }
    
    // Validate that farm data has required values
    if (!farmData.totalBegInv || farmData.totalBegInv <= 0) {
      alert('Error: Total Beginning Inventory is not set. Please complete the Loading Detail Setup first.')
      return
    }
    
    if (!farmData.initialGrams || farmData.initialGrams <= 0) {
      alert('Error: Initial Grams is not set. Please complete the Loading Detail Setup first.')
      return
    }

    setLoading(true)
    
    try {
      // Daily Mortality is optional - default to 0 if not provided
      if (!newRecord.dailyMortality) {
        newRecord.dailyMortality = 0
      }
      
      // ALW is optional - default to 0 if not provided
      if (!newRecord.alw) {
        newRecord.alw = 0
      }

      const lastRecord = dailyRecords[dailyRecords.length - 1]
      const dailyFeedsNum = newRecord.dailyFeeds || 0
      const feedsDeliveryNum = newRecord.feedsDelivery || 0
      const dailyMortalityNum = newRecord.dailyMortality || 0
      const alwNum = newRecord.alw || 0
      
      console.log('🧮 [CALC] Calculation inputs:', {
        lastRecord: lastRecord ? 'exists' : 'none',
        dailyFeedsNum,
        feedsDeliveryNum,
        dailyMortalityNum,
        alwNum,
        farmDataTotalBegInv: farmData.totalBegInv,
        farmDataInitialGrams: farmData.initialGrams
      })
      
      const cumulativeFeeds = (lastRecord?.cumulativeFeeds || 0) + dailyFeedsNum
      const remainingFeeds = (lastRecord?.remainingFeeds || 0) + feedsDeliveryNum - dailyFeedsNum
      const cumulativeMortality = (lastRecord?.cumulativeMortality || 0) + dailyMortalityNum
      const endingHeads = (lastRecord?.endingHeads || farmData.totalBegInv) - dailyMortalityNum
      const mortalityPercent = (cumulativeMortality / farmData.totalBegInv) * 100

      // Calculate ADG (Average Daily Gain)
      const previousALW = lastRecord?.alw || farmData.initialGrams
      const adg = (alwNum - previousALW) / 1 // per day
      
      console.log('🧮 [CALC] Calculation results:', {
        cumulativeFeeds,
        remainingFeeds,
        cumulativeMortality,
        endingHeads,
        mortalityPercent,
        previousALW,
        adg
      })

      const completeRecord: DailyRecord = {
        date: newRecord.date || "",
        age: newRecord.age || 0,
        dailyFeeds: dailyFeedsNum,
        cumulativeFeeds,
        feedsDelivery: feedsDeliveryNum,
        remainingFeeds,
        dailyMortality: dailyMortalityNum,
        cumulativeMortality,
        mortalityPercent: Number.parseFloat(mortalityPercent.toFixed(2)),
        endingHeads,
        alw: alwNum,
        adg: Number.parseFloat(adg.toFixed(1)),
        remarks: newRecord.remarks || "",
        mortalityImage: mortalityImage || undefined,
      }

      const updatedRecords = [...dailyRecords, completeRecord]
      console.log('🔄 [ADD RECORD] Updating dailyRecords state with:', updatedRecords.length, 'records')
      console.log('🔍 [ADD RECORD] New record details:', { date: completeRecord.date, age: completeRecord.age })
      
      setDailyRecords(updatedRecords)

      // Auto-save the records
      if (onSave) {
        console.log('💾 [ADD RECORD] Calling onSave function with updated records...')
        console.log('🔍 [ADD RECORD] About to save records:', updatedRecords.map(r => ({ date: r.date, age: r.age })))
        try {
          await onSave(updatedRecords)
          console.log('✅ [ADD RECORD] Successfully saved to database')
        } catch (saveError) {
          console.error('❌ [ADD RECORD ERROR] Failed to save to database:', saveError)
          console.error('🔍 [ADD RECORD ERROR] Save error details:', {
            message: saveError instanceof Error ? saveError.message : 'Unknown error',
            error: saveError
          })
          // Revert the UI state if save failed
          setDailyRecords(dailyRecords)
          throw new Error(`Failed to save record to database: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`)
        }
      } else {
        console.log('⚠️ [ADD RECORD] No onSave function provided')
      }

      // Show success message
      showSuccessMessage("Record added successfully!")

      // Reset form - date and age will be auto-calculated by useEffect
      setNewRecord(prev => ({
        ...prev,
        dailyFeeds: undefined,
        feedsDelivery: undefined,
        dailyMortality: undefined,
        alw: undefined,
        remarks: "",
      }))
      setMortalityImage(null) // Reset image after adding
      setImageFile(null)
    } catch (error) {
      console.error('Error adding record:', error)
      alert('Failed to add record. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const deleteRecord = async (index: number) => {
    // Confirm deletion
    const record = dailyRecords[index]
    if (!confirm(`Are you sure you want to delete the record for ${record.date} (Age ${record.age})?`)) {
      return
    }
    
    setLoading(true)
    
    // Store the original records in case we need to revert
    const originalRecords = [...dailyRecords]
    
    try {
      const updatedRecords = dailyRecords.filter((_, i) => i !== index)
      
      // Reindex ages for all remaining records
      const reindexedRecords = updatedRecords.map((record, newIndex) => ({
        ...record,
        age: newIndex
      }))
      
      // Update UI immediately for better UX
      setDailyRecords(reindexedRecords)
      
      // Auto-save after deletion
      if (onSave) {
        await onSave(reindexedRecords)
      }

      // Show success message
      showSuccessMessage("Record deleted successfully!")
    } catch (error) {
      console.error('Error deleting record:', error)
      // Revert the UI state if save failed
      setDailyRecords(originalRecords)
      alert('Failed to delete record. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startEditRecord = (index: number) => {
    const record = dailyRecords[index]
    setEditingRecord(index)
    setEditFormData({
      dailyFeeds: record.dailyFeeds,
      feedsDelivery: record.feedsDelivery,
      dailyMortality: record.dailyMortality,
      alw: record.alw,
      remarks: record.remarks || "",
    })
  }

  const cancelEditRecord = () => {
    setEditingRecord(null)
    setEditFormData({})
    console.log('🔄 [EDIT] Edit operation cancelled')
  }

  const saveEditRecord = async (index: number) => {
    // Validate required fields
    if (!editFormData.dailyFeeds || editFormData.dailyFeeds === 0) {
      alert('Please enter a value for Daily Feeds.')
      return
    }
    
    setLoading(true)
    
    try {
      const record = dailyRecords[index]
      const updatedRecord = {
        ...record,
        dailyFeeds: editFormData.dailyFeeds || 0,
        feedsDelivery: editFormData.feedsDelivery || 0,
        dailyMortality: editFormData.dailyMortality || 0,
        alw: editFormData.alw || 0,
        remarks: editFormData.remarks || "",
      }

      // Recalculate cumulative values
      const previousRecord = index > 0 ? dailyRecords[index - 1] : null
      const dailyFeedsNum = updatedRecord.dailyFeeds
      const feedsDeliveryNum = updatedRecord.feedsDelivery
      const dailyMortalityNum = updatedRecord.dailyMortality
      const alwNum = updatedRecord.alw

      updatedRecord.cumulativeFeeds = (previousRecord?.cumulativeFeeds || 0) + dailyFeedsNum
      updatedRecord.remainingFeeds = (previousRecord?.remainingFeeds || 0) + feedsDeliveryNum - dailyFeedsNum
      updatedRecord.cumulativeMortality = (previousRecord?.cumulativeMortality || 0) + dailyMortalityNum
      updatedRecord.endingHeads = (previousRecord?.endingHeads || (farmData.totalBegInv || 0)) - dailyMortalityNum
      updatedRecord.mortalityPercent = (updatedRecord.cumulativeMortality / (farmData.totalBegInv || 1)) * 100

      // Calculate ADG
      const previousALW = previousRecord?.alw || (farmData.initialGrams || 0)
      updatedRecord.adg = (alwNum - previousALW) / 1

      const updatedRecords = [...dailyRecords]
      updatedRecords[index] = updatedRecord
      
      // Recalculate all cumulative values for records after the edited one
      for (let i = index + 1; i < updatedRecords.length; i++) {
        const currentRecord = updatedRecords[i]
        const prevRecord = updatedRecords[i - 1]
        
        currentRecord.cumulativeFeeds = (prevRecord.cumulativeFeeds || 0) + (currentRecord.dailyFeeds || 0)
        currentRecord.remainingFeeds = (prevRecord.remainingFeeds || 0) + (currentRecord.feedsDelivery || 0) - (currentRecord.dailyFeeds || 0)
        currentRecord.cumulativeMortality = (prevRecord.cumulativeMortality || 0) + (currentRecord.dailyMortality || 0)
        currentRecord.endingHeads = (prevRecord.endingHeads || (farmData.totalBegInv || 0)) - (currentRecord.dailyMortality || 0)
        currentRecord.mortalityPercent = (currentRecord.cumulativeMortality / (farmData.totalBegInv || 1)) * 100
        
        // Recalculate ADG
        const prevALW = prevRecord.alw || (farmData.initialGrams || 0)
        currentRecord.adg = ((currentRecord.alw || 0) - prevALW) / 1
      }
      
      setDailyRecords(updatedRecords)

      // Auto-save
      if (onSave) {
        await onSave(updatedRecords)
      }

      // Show success message
      showSuccessMessage("Record updated successfully!")

      setEditingRecord(null)
      setEditFormData({})
    } catch (error) {
      console.error('Error updating record:', error)
      alert('Failed to update record. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Check if the current date input would create a duplicate
  const isDuplicateDate = dailyRecords.some(record => record.date === newRecord.date)
  
  // Debug button state
  console.log('🔍 [BUTTON DEBUG] Button state:', {
    isDuplicateDate,
    hasDate: !!newRecord.date,
    loading,
    disabled: isDuplicateDate || !newRecord.date || loading,
    newRecordDate: newRecord.date,
    newRecordAge: newRecord.age
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Loading and Success Messages */}
      {loading && (
        <div className="p-3 sm:p-4 text-center bg-blue-50 border border-blue-200 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-xs sm:text-sm text-blue-600">Processing...</p>
        </div>
      )}
      
      {successMessage && (
        <div className="p-3 sm:p-4 text-center bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs sm:text-sm text-green-600 font-medium">{successMessage}</p>
        </div>
      )}



      <Card>
        <div className="p-4 border-b">
          <CardTitle className="flex items-center gap-2">
            Add Daily Record
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </CardTitle>
          <CardDescription>Enter daily farm data for tracking</CardDescription>
        </div>
        <CardContent className={loading ? "opacity-75 pointer-events-none relative" : ""}>
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-600 font-medium">Adding record...</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newRecord.date}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="age">Age (Days)</Label>
              <Input
                id="age"
                type="number"
                value={newRecord.age || ''}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="dailyFeeds">Daily Feeds (per bag)</Label>
                             <Input
                 id="dailyFeeds"
                 type="number"
                 value={newRecord.dailyFeeds || ''}
                 onChange={(e) => setNewRecord({ ...newRecord, dailyFeeds: e.target.value ? Number(e.target.value) : undefined })}
               />
            </div>
            <div>
              <Label htmlFor="feedsDelivery">Feeds Delivery (kg) (Optional)</Label>
                             <Input
                 id="feedsDelivery"
                 type="number"
                 value={newRecord.feedsDelivery || ''}
                 onChange={(e) => setNewRecord({ ...newRecord, feedsDelivery: e.target.value ? Number(e.target.value) : undefined })}
               />
            </div>
            <div>
              <Label htmlFor="dailyMortality">Daily Mortality (Optional)</Label>
                             <Input
                 id="dailyMortality"
                 type="number"
                 placeholder="0"
                 value={newRecord.dailyMortality || ''}
                 onChange={(e) => setNewRecord({ ...newRecord, dailyMortality: e.target.value ? Number(e.target.value) : undefined })}
               />
              <p className="text-xs text-gray-500 mt-1">Leave empty for 0 mortality</p>
              {/* Mortality Image Upload */}
              <div className="mt-2">
                <input
                  id="mortality-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {!mortalityImage ? (
                  <label htmlFor="mortality-image-input" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                      <Upload className="w-4 h-4" />
                      Upload Mortality Photo
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 h-12 rounded border overflow-hidden">
                      <img
                        src={mortalityImage}
                        alt="Mortality preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openImageModal(mortalityImage)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="alw">ALW (grams) (Optional)</Label>
                             <Input
                 id="alw"
                 type="number"
                 step="0.1"
                 value={newRecord.alw || ''}
                 onChange={(e) => setNewRecord({ ...newRecord, alw: e.target.value ? Number(e.target.value) : undefined })}
               />
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-4">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={newRecord.remarks || ''}
                onChange={(e) => setNewRecord({ ...newRecord, remarks: e.target.value })}
                placeholder="Enter detailed remarks or notes..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-end">
              <Button 
                onClick={addRecord} 
                className="w-full"
                disabled={isDuplicateDate || !newRecord.date || loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Record...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle>Daily Records</CardTitle>
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
            {dailyRecords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={exportToExcel}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Download className="w-4 h-4" />
                  Export to Excel
                </Button>
                <Button 
                  onClick={viewCSVData}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Eye className="w-4 h-4" />
                  View as CSV
                </Button>
                <Button 
                  onClick={downloadCSV}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>
              </div>
            )}
          </div>
          <CardDescription>Complete tracking history</CardDescription>
        </div>
        <CardContent>
          <div className="space-y-4">
            {dailyRecords.map((record, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                {/* Header - Date and Age */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-lg">{record.date}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Day {record.age}</span>
                  </div>
                  
                  {/* Action Buttons - Desktop */}
                  <div className="hidden sm:flex gap-2">
                    {editingRecord === index ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => saveEditRecord(index)} disabled={loading}>
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelEditRecord} disabled={loading}>
                          <XCircle className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => startEditRecord(index)}>
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteRecord(index)} disabled={loading}>
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Data Grid - Responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 text-xs sm:text-sm">
                  {/* Daily Feeds */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Daily Feeds</p>
                    {editingRecord === index ? (
                      <Input
                        type="number"
                        value={editFormData.dailyFeeds || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, dailyFeeds: e.target.value ? Number(e.target.value) : undefined })}
                        className="text-center h-8 text-sm"
                      />
                    ) : (
                      <p className="font-semibold text-lg">{record.dailyFeeds}</p>
                    )}
                  </div>

                  {/* Feeds Delivery */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Feeds Del.</p>
                    {editingRecord === index ? (
                      <Input
                        type="number"
                        value={editFormData.feedsDelivery || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, feedsDelivery: e.target.value ? Number(e.target.value) : undefined })}
                        className="text-center h-8 text-sm"
                      />
                    ) : (
                      <p className="font-semibold text-lg">{record.feedsDelivery}</p>
                    )}
                  </div>

                  {/* Daily Mortality */}
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Daily Mort.</p>
                    {editingRecord === index ? (
                      <Input
                        type="number"
                        value={editFormData.dailyMortality || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, dailyMortality: e.target.value ? Number(e.target.value) : undefined })}
                        className="text-center h-8 text-sm"
                      />
                    ) : (
                      <p className="font-semibold text-lg text-red-600">{record.dailyMortality}</p>
                    )}
                    {record.mortalityImage && (
                      <button
                        onClick={() => openImageModal(record.mortalityImage!)}
                        className="w-full h-8 rounded border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all duration-200 overflow-hidden mt-1"
                        title="View mortality photo"
                      >
                        <img
                          src={record.mortalityImage}
                          alt="Mortality photo"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                  </div>

                  {/* ALW */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">ALW</p>
                    {editingRecord === index ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editFormData.alw || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, alw: e.target.value ? Number(e.target.value) : undefined })}
                        className="text-center h-8 text-sm"
                      />
                    ) : (
                      <p className="font-semibold text-lg text-green-600">{record.alw}g</p>
                    )}
                  </div>

                  {/* ADG */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">ADG</p>
                    <p className="font-semibold text-lg text-blue-600">{record.adg}g</p>
                  </div>

                  {/* Ending Heads */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Ending Heads</p>
                    <p className="font-semibold text-lg text-purple-600">{record.endingHeads}</p>
                  </div>

                  {/* Cumulative Mortality */}
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Cum. Mort.</p>
                    <p className="font-semibold text-lg text-red-600">{record.cumulativeMortality}</p>
                  </div>

                  {/* Mortality Percentage */}
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase font-medium mb-1">Mort. %</p>
                    <p className="font-semibold text-lg text-orange-600">{record.mortalityPercent.toFixed(2)}%</p>
                  </div>
                </div>

                {/* Remarks Section */}
                <div className="mt-3">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Remarks</p>
                  {editingRecord === index ? (
                    <Input
                      value={editFormData.remarks || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                      placeholder="Enter remarks..."
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2 min-h-[32px]" title={record.remarks || "No remarks"}>
                      {record.remarks || "No remarks"}
                    </p>
                  )}
                </div>

                {/* Action Buttons - Mobile */}
                <div className="flex gap-2 mt-3 sm:hidden">
                  {editingRecord === index ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => saveEditRecord(index)} disabled={loading} className="flex-1">
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEditRecord} disabled={loading} className="flex-1">
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => startEditRecord(index)} className="flex-1">
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteRecord(index)} disabled={loading} className="flex-1">
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></div>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Mortality Photo</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeImageModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <img 
                src={selectedImage} 
                alt="Mortality photo - Full size" 
                className="w-full h-auto max-h-[70vh] object-contain rounded" 
              />
            </div>
            <div className="flex justify-end p-4 border-t bg-gray-50">
              <Button onClick={closeImageModal} variant="outline" className="mr-2">
                Close
              </Button>
              <Button 
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = selectedImage
                  link.download = 'mortality-photo.png'
                  link.click()
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Modal */}
      {showCSVModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Daily Records - CSV Format</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCSVModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-auto max-h-[70vh]">
              <div className="mb-4 text-sm text-gray-600">
                This is your daily records data in table format. You can copy this data and paste it into Excel, Google Sheets, or any CSV-compatible application.
              </div>
              <div className="border rounded-lg overflow-auto bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">DATE</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">AGE</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">DAILY FEEDS INTAKE</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">CUMULATIVE FEEDS</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">FEEDS DELIVERY</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">REMAINING FEEDS</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">DAILY MORTALITY</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">CUMULATIVE MORTALITY</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">% CUM MORTALITY</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">ENDING HEADS</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">ALW</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900 border-r">ADG</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRecords.map((record, index) => (
                      <tr key={index} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-3 py-2 border-r text-gray-900">{record.date}</td>
                        <td className="px-3 py-2 border-r text-gray-900">{record.age}</td>
                        <td className="px-3 py-2 border-r text-gray-900">{record.dailyFeeds || '-'}</td>
                        <td className="px-3 py-2 border-r text-gray-900">{record.cumulativeFeeds || '-'}</td>
                        <td className="px-3 py-2 border-r text-gray-900">{record.feedsDelivery || '-'}</td>
                        <td className="px-3 py-2 border-r text-gray-900">{record.remainingFeeds || '-'}</td>
                        <td className="px-3 py-2 border-r text-gray-900">{record.dailyMortality || '-'}</td>
                        <td className="px-3 py-2 border-r text-gray-900">{record.cumulativeMortality || '-'}</td>
                        <td className="px-3 py-2 border-r text-gray-900">{record.mortalityPercent ? `${record.mortalityPercent}%` : '-'}</td>
                        <td className="px-3 py-2 border-r text-gray-900">{record.endingHeads || '-'}</td>
                        <td className="px-3 py-2 border-r text-gray-900">{record.alw || '-'}</td>
                        <td className="px-3 py-2 border-r text-gray-900">{record.adg || '-'}</td>
                        <td className="px-3 py-2 text-gray-900">{record.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 border-t bg-gray-50">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={copyTableToClipboard}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Copy Table
                </Button>
                <Button 
                  onClick={copyCSVToClipboard}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Copy as CSV
                </Button>
                <Button 
                  onClick={downloadCSV}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>
                
                {/* Share Button with Dropdown */}
                <div className="relative">
                  <Button 
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  
                  {showShareMenu && (
                    <div className="absolute bottom-full mb-2 left-0 bg-white border rounded-lg shadow-lg py-2 z-10 min-w-[160px]">
                      <button 
                        onClick={() => {
                          shareData('whatsapp')
                          setShowShareMenu(false)
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        WhatsApp
                      </button>
                      <button 
                        onClick={() => {
                          shareData('messenger')
                          setShowShareMenu(false)
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        Messenger
                      </button>
                      <button 
                        onClick={() => {
                          shareData('viber')
                          setShowShareMenu(false)
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Phone className="w-4 h-4 text-purple-600" />
                        Viber
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={() => setShowCSVModal(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
