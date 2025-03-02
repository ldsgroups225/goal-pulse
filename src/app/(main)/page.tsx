'use client';

import { Suspense } from 'react';
import { getLivePredictions } from '@/lib/api/prediction-api';
import { PredictionCard } from '@/components/prediction-card';
import { useEffect } from 'react';


// Simple loading skeleton
function PredictionSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i} 
          className="w-full h-[180px] rounded-xl bg-gray-100 animate-pulse"
        />
      ))}
    </div>
  );
}

export default async function Home() {
  // Pre-fetch live predictions for server rendering
  const initialData = await getLivePredictions();
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold px-1">Live Predictions</h1>
      
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center space-x-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-sm font-medium text-gray-700">Live now</span>
        </div>
        <div className="text-sm text-gray-500">
          {initialData.length} matches
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
    <div className="space-y-4">
      {initialData.length > 0 ? (
        initialData.map((match) => (
          <PredictionCard
            key={match.fixtureId}
            data={match}
          />
        ))
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-500">No live matches at the moment</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for live predictions</p>
        </div>
      )}
    </div>
  );
}
