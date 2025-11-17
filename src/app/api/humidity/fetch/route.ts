import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchAndStoreHumidityData } from '@/lib/weather-api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    
    // Get the request body
    const { humiditySettingId } = await request.json()
    
    if (!humiditySettingId) {
      return NextResponse.json(
        { error: 'Humidity setting ID is required' },
        { status: 400 }
      )
    }

    // Fetch and store humidity data
    const result = await fetchAndStoreHumidityData(supabase, humiditySettingId)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in humidity fetch API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch humidity data for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's humidity settings
    const { data: settings, error: settingsError } = await supabase
      .from('humidity_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'No humidity settings found' },
        { status: 404 }
      )
    }

    // Get latest humidity data
    const { data: humidityData, error: dataError } = await supabase
      .from('humidity_data')
      .select('*')
      .eq('humidity_setting_id', settings.id)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single()

    if (dataError) {
      return NextResponse.json(
        { error: 'No humidity data found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: humidityData,
      settings
    })
  } catch (error) {
    console.error('Error in humidity GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
