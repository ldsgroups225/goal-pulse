'use client';

import { Suspense } from 'react';
import { getLivePredictions } from '@/lib/api/prediction-api';
import { PredictionCard } from '@/components/prediction-card';
import { useEffect } from 'react';


// Simple loading skeleton with grid support
function PredictionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div 
          key={i} 
          className="w-full h-[220px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
      ))}
    </div>
  );
}

export default async function Home() {
  // Pre-fetch live predictions for server rendering
  const initialData = await getLivePredictions();
  
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
            {initialData.length} matches
          </div>
        </div>
      </div>
      
      <Suspense fallback={<PredictionSkeleton />}>
        <PredictionList initialData={initialData} />
      </Suspense>
    </div>
  );
}

function PredictionList({ initialData }: { initialData: any[] }) {
  useEffect(() => {
    // Store the last update time for offline access
    localStorage.setItem('lastUpdateTime', new Date().toISOString());
  }, [initialData]);

  return (
    <div>
      {initialData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {initialData.map((match) => (
            <PredictionCard
              key={match.fixtureId}
              data={match}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <p className="text-foreground/70">No live matches at the moment</p>
          <p className="text-sm text-muted-foreground mt-1">Check back later for live predictions</p>
        </div>
      )}
    </div>
  );
}
