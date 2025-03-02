// src/app/(main)/_components/PredictionList.tsx

'use client'

import { PredictionCard } from '@/components/prediction-card'
import { useState, useEffect } from 'react'
import { MatchPrediction } from '@/types'

export function PredictionList({ initialData }: { initialData: MatchPrediction[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredMatches, setFilteredMatches] = useState<MatchPrediction[]>(initialData)
  
  // Sort and filter matches whenever initialData or searchTerm changes
  useEffect(() => {
    // Store the last update time for offline access
    localStorage.setItem('lastUpdateTime', new Date().toISOString())
    
    // Apply search filter and sorting
    const filtered = initialData
      .filter(match => {
        if (!searchTerm) return true
        
        const searchLower = searchTerm.toLowerCase()
        return (
          match.teams.home.name.toLowerCase().includes(searchLower) ||
          match.teams.away.name.toLowerCase().includes(searchLower) ||
          match.league.name.toLowerCase().includes(searchLower) ||
          match.league.country.toLowerCase().includes(searchLower)
        )
      })
      .sort((a, b) => {
        // Sort by:
        // 1. Live matches first
        // 2. Live matches with red cards first
        // 3. Matches with higher confidence
        
        // First priority: Live matches
        if (a.status.isLive && !b.status.isLive) return -1
        if (!a.status.isLive && b.status.isLive) return 1
        
        // Second priority: Red cards for live matches
        if (a.status.isLive && b.status.isLive) {
          const aHasRedCard = a.stats.cards.home.red > 0 || a.stats.cards.away.red > 0
          const bHasRedCard = b.stats.cards.home.red > 0 || b.stats.cards.away.red > 0
          
          if (aHasRedCard && !bHasRedCard) return -1
          if (!aHasRedCard && bHasRedCard) return 1
        }
        
        // Third priority: Sort by prediction confidence
        return b.prediction.confidence - a.prediction.confidence
      })
      
    setFilteredMatches(filtered)
  }, [initialData, searchTerm])

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input 
          type="search" 
          className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
          placeholder="Search by team, league, or country" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredMatches.length > 0
        ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {filteredMatches.map(match => (
                <PredictionCard
                  key={match.fixtureId}
                  data={match}
                />
              ))}
            </div>
          )
        : (
            <div className="py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              {searchTerm ? (
                <p className="text-foreground/70">No matches found for "{searchTerm}"</p>
              ) : (
                <>
                  <p className="text-foreground/70">No live matches at the moment</p>
                  <p className="text-sm text-muted-foreground mt-1">Check back later for live predictions</p>
                </>
              )}
            </div>
          )}
    </div>
  )
}
