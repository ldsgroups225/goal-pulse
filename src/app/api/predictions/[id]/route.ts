import { NextRequest, NextResponse } from 'next/server';
import { getMatchPredictionById } from '@/app/lib/api/prediction-api';

export const dynamic = 'force-dynamic'; // Ensure this route is not statically optimized

/**
 * GET handler for /api/predictions/[id]
 * Returns prediction data for a specific match by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid ID format' 
        },
        { status: 400 }
      );
    }
    
    const prediction = await getMatchPredictionById(id);
    
    if (!prediction) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Prediction not found' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`API error fetching prediction with ID ${params.id}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch prediction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
