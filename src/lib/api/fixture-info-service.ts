// src/lib/api/fixture-info-service.ts

import type { FixtureInfoResponse } from '@/types/fixture-info'
import { cache } from 'react'

// Fixture info cache to reduce API calls
const fixtureInfoCache: Map<number, { data: FixtureInfoResponse, timestamp: number }> = new Map()

// Cache expiry time in milliseconds (30 minutes)
const CACHE_EXPIRY = 30 * 60 * 1000

/**
 * Fetch fixture information from the API
 * Includes detailed team statistics and historical data
 */
export const fetchFixtureInfo = cache(async (fixtureId: number): Promise<FixtureInfoResponse | undefined> => {
  try {
    // Check cache first
    const cached = fixtureInfoCache.get(fixtureId)
    const now = Date.now()

    // Return cached data if it exists and is not expired
    if (cached && (now - cached.timestamp) < CACHE_EXPIRY) {
      console.warn(`Using cached fixture info for fixture ${fixtureId}`)
      return cached.data
    }

    // Fetch fresh data
    console.warn(`Fetching fixture info for fixture ${fixtureId}`)
    const url = `https://api.betmines.com/betmines/v1/fixtures/info/${fixtureId}?includeSeasonStats=true`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // Revalidate every minute
    })

    if (!response.ok) {
      console.error(`Error fetching fixture info: ${response.status} ${response.statusText}`)
      return undefined
    }

    const data = await response.json() as FixtureInfoResponse

    // Update cache
    fixtureInfoCache.set(fixtureId, { data, timestamp: now })

    return data
  }
  catch (error) {
    console.error('Failed to fetch fixture info:', error)
    return undefined
  }
})

/**
 * Get the fixture info from cache or fetch it if not available
 */
export const getFixtureInfo = cache(async (fixtureId: number): Promise<FixtureInfoResponse | undefined> => {
  return await fetchFixtureInfo(fixtureId)
})

/**
 * Preload fixture info for multiple fixtures
 * Useful for preloading data for upcoming matches
 */
export async function preloadFixtureInfo(fixtureIds: number[]): Promise<void> {
  const loadPromises = fixtureIds.map(id => fetchFixtureInfo(id))
  await Promise.allSettled(loadPromises)
}
