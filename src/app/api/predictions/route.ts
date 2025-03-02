import { NextResponse } from 'next/server';
import { getLivePredictions } from '@/lib/api/prediction-api';

export const dynamic = 'force-dynamic'; // Ensure this route is not statically optimized
export const revalidate = 60;

/**
 * GET handler for /api/predictions
 * Returns all live match predictions
 */
export async function GET() {
  try {
    const predictions = await getLivePredictions();
    
    const response = NextResponse.json({
      success: true,
      data: predictions,
      count: predictions.length,
      timestamp: new Date().toISOString()
    });
    
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    
    return response;
  } catch (error) {
    console.error('API error fetching predictions:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch predictions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
