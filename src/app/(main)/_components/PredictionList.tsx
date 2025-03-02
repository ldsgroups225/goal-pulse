// src/app/(main)/_components/PredictionList.tsx

'use client'

import { PredictionCard } from '@/components/prediction-card'
import { useEffect } from 'react'

export function PredictionList({ initialData }: { initialData: any[] }) {
  useEffect(() => {
    // Store the last update time for offline access
    localStorage.setItem('lastUpdateTime', new Date().toISOString())
  }, [initialData])

  return (
    <div>
      {initialData.length > 0
        ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {initialData.map(match => (
                <PredictionCard
                  key={match.fixtureId}
                  data={match}
                />
              ))}
            </div>
          )
        : (
            <div className="py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <p className="text-foreground/70">No live matches at the moment</p>
              <p className="text-sm text-muted-foreground mt-1">Check back later for live predictions</p>
            </div>
          )}
    </div>
  )
}
