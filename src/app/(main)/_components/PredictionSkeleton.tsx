// src/app/(main)/_components/PredictionSkeleton.tsx

import React from 'react'

/**
 * Loading skeleton for prediction cards
 */
export function PredictionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
      {Array(6).fill(0).map((_, i) => (
        <div key={i}
          className="w-full h-[220px] rounded-xl bg-muted dark:bg-muted animate-pulse"
        />
      ))}
    </div>
  )
}
