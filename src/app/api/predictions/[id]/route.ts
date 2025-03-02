// src/app/api/predictions/[id]/route.ts

import type { NextRequest } from 'next/server'
import { getMatchPredictionById } from '@/lib/api/prediction-api'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // Ensure this route is not statically optimized
export const revalidate = 60

/**
 * GET handler for /api/predictions/[id]
 * Returns prediction data for a specific match by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const matchId = Number.parseInt(id, 10)

    if (Number.isNaN(matchId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format',
        },
        { status: 400 },
      )
    }

    const prediction = await getMatchPredictionById(matchId)

    if (!prediction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prediction not found',
        },
        { status: 404 },
      )
    }

    const response = NextResponse.json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString(),
    })

    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60')

    return response
  }
  catch (error) {
    console.error('API error fetching prediction:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch prediction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
