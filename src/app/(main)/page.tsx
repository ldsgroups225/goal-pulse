// src/app/(main)/page.tsx

import { getLivePredictions } from '@/lib/api/prediction-api'
import { Suspense } from 'react'
import { PredictionList } from './_components/PredictionList'
import { PredictionSkeleton } from './_components/PredictionSkeleton'

export default async function Home() {
  // Pre-fetch live predictions for server rendering
  const initialData = await getLivePredictions()

  // Count number of live matches and red card matches
  const liveMatches = initialData.filter(match => match.status.isLive).length
  const redCardMatches = initialData.filter(match =>
    match.status.isLive
    && (match.stats.cards.home.red > 0 || match.stats.cards.away.red > 0),
  ).length
  const upcomingMatches = initialData.filter(match => match.status.status === 'NS').length
  const completedMatches = initialData.filter(match => match.status.status === 'FT').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-2xl font-bold px-1">Live Predictions</h1>

        <div className="flex flex-wrap items-center justify-between px-1 gap-2">
          {/* Live indicator */}
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 dark:bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 dark:bg-red-400"></span>
            </span>
            <span className="text-sm font-medium text-foreground/80">Live now</span>
          </div>

          {/* Match stats summary */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-md">
              Live:
              {' '}
              {liveMatches}
            </div>
            {redCardMatches > 0 && (
              <div className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-md">
                Red Cards:
                {' '}
                {redCardMatches}
              </div>
            )}
            <div className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-md">
              Upcoming:
              {' '}
              {upcomingMatches}
            </div>
            <div className="px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300 rounded-md">
              Completed:
              {' '}
              {completedMatches}
            </div>
            <div className="text-muted-foreground">
              Total:
              {' '}
              {initialData.length}
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<PredictionSkeleton />}>
        <PredictionList initialData={initialData} />
      </Suspense>
    </div>
  )
}
