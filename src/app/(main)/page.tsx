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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75 dark:bg-destructive"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive dark:bg-destructive"></span>
            </span>
            <span className="text-sm font-medium text-foreground/80">Live now</span>
          </div>

          {/* Match stats summary */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="px-2 py-0.5 bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive rounded-md">
              Live:
              {' '}
              {liveMatches}
            </div>
            {redCardMatches > 0 && (
              <div className="px-2 py-0.5 bg-accent/10 text-accent-foreground dark:bg-accent/20 dark:text-accent-foreground rounded-md">
                Red Cards:
                {' '}
                {redCardMatches}
              </div>
            )}
            <div className="px-2 py-0.5 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary rounded-md">
              Upcoming:
              {' '}
              {upcomingMatches}
            </div>
            <div className="px-2 py-0.5 bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground rounded-md">
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
