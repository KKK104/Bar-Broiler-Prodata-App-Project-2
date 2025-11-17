import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchAndStoreHumidityData } from '@/lib/weather-api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron job (optional security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    
    // Get all enabled humidity settings
    const { data: settings, error: settingsError } = await supabase
      .from('humidity_settings')
      .select('*')
      .eq('is_enabled', true)

    if (settingsError) {
      throw new Error(`Failed to fetch humidity settings: ${settingsError.message}`)
    }

    if (!settings || settings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No enabled humidity settings found',
        processed: 0
      })
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    // Process each setting
    for (const setting of settings) {
      try {
        const result = await fetchAndStoreHumidityData(supabase, setting.id)
        
        if (result.success) {
          successCount++
          results.push({
            settingId: setting.id,
            locationName: setting.location_name,
            success: true,
            data: result.data
          })
        } else {
          errorCount++
          results.push({
            settingId: setting.id,
            locationName: setting.location_name,
            success: false,
            error: result.error
          })
        }
      } catch (error) {
        errorCount++
        results.push({
          settingId: setting.id,
          locationName: setting.location_name,
          success: false,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${settings.length} humidity settings`,
      processed: settings.length,
      successCount,
      errorCount,
      results
    })
  } catch (error) {
    console.error('Error in humidity cron job:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    )
  }
}

// GET endpoint for manual testing
export async function GET() {
  return NextResponse.json({
    message: 'Humidity cron job endpoint',
    usage: 'POST to this endpoint to trigger humidity data updates',
    note: 'This endpoint should be called by a cron service every 15 minutes'
  })
}
