// src/app/(main)/_components/PredictionSkeleton.tsx

import React from 'react'

/**
 * Loading skeleton for prediction cards
 */
export function PredictionSkeleton() {
  const randomId = Math.random().toString(36).substring(7)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
      {Array.from({ length: 6 }).fill(0).map(() => (
        <div
          key={randomId}
          className="w-full h-[220px] rounded-xl bg-muted dark:bg-muted animate-pulse"
        />
      ))}
    </div>
  )
}
