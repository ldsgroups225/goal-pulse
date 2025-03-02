// src/app/(main)/page.tsx

import { getLivePredictions } from '@/lib/api/prediction-api'
import { Suspense } from 'react'
import { PredictionList } from './_components/PredictionList'
import { PredictionSkeleton } from './_components/PredictionSkeleton'

export default async function Home() {
  // Pre-fetch live predictions for server rendering
  const initialData = await getLivePredictions()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h1 className="text-2xl font-bold px-1">Live Predictions</h1>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2 mr-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 dark:bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 dark:bg-red-400"></span>
            </span>
            <span className="text-sm font-medium text-foreground/80">Live now</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {initialData.length}
            {' '}
            matches
          </div>
        </div>
      </div>

      <Suspense fallback={<PredictionSkeleton />}>
        <PredictionList initialData={initialData} />
      </Suspense>
    </div>
  )
}
