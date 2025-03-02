// src/app/(main)/_components/PredictionList.tsx

'use client'

import type { MatchPrediction } from '@/types'
import { PredictionCard } from '@/components/prediction-card'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './PredictionList.module.css'

export function PredictionList({ initialData }: { initialData: MatchPrediction[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filteredMatches, setFilteredMatches] = useState<MatchPrediction[]>(initialData)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle debounced search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms debounce delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Sort and filter matches whenever initialData or debouncedSearchTerm changes
  useEffect(() => {
    // Store the last update time for offline access
    localStorage.setItem('lastUpdateTime', new Date().toISOString())

    // Apply search filter and sorting
    const filtered = initialData
      .filter((match) => {
        if (!debouncedSearchTerm)
          return true

        const searchLower = debouncedSearchTerm.toLowerCase()
        return (
          match.teams.home.name.toLowerCase().includes(searchLower)
          || match.teams.away.name.toLowerCase().includes(searchLower)
          || match.league.name.toLowerCase().includes(searchLower)
          || match.league.country.toLowerCase().includes(searchLower)
        )
      })
      .sort((a, b) => {
        // Sort by:
        // 1. Live matches first
        // 2. Live matches with red cards first
        // 3. Matches with higher confidence

        // First priority: Live matches
        if (a.status.isLive && !b.status.isLive)
          return -1
        if (!a.status.isLive && b.status.isLive)
          return 1

        // Second priority: Red cards for live matches
        if (a.status.isLive && b.status.isLive) {
          const aHasRedCard = a.stats?.cards?.home?.red > 0 || a.stats?.cards?.away?.red > 0
          const bHasRedCard = b.stats?.cards?.home?.red > 0 || b.stats?.cards?.away?.red > 0

          if (aHasRedCard && !bHasRedCard)
            return -1
          if (!aHasRedCard && bHasRedCard)
            return 1
        }

        // Third priority: Sort by prediction confidence
        return b.prediction.confidence - a.prediction.confidence
      })

    setFilteredMatches(filtered)
  }, [initialData, debouncedSearchTerm])

  // Handle scroll event to collapse search at top
  useEffect(() => {
    const handleScroll = () => {
      // Increased threshold to account for header height (64px)
      if (window.scrollY > 100) {
        if (!isScrolled)
          setIsScrolled(true)
      }
      else {
        if (isScrolled)
          setIsScrolled(false)
      }
    }

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isScrolled])

  // Focus search when clicking on the collapsed search bar
  const handleSearchBarClick = useCallback(() => {
    if (isScrolled && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isScrolled])

  // Clear search button handler
  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Search input - sticky on scroll */}
      <div
        ref={searchContainerRef}
        className={`
          transition-all duration-300 ease-in-out 
          ${isScrolled
      ? `sticky top-16 z-30 py-2 px-1 bg-background/95 backdrop-blur-md border-b border-border/60 shadow-sm dark:bg-background/80 dark:border-border/40 ${styles.stickySearch}`
      : 'relative'}
        `}
      >
        <div
          className={`
            relative rounded-lg overflow-hidden
            ${isScrolled
      ? 'transform transition-transform duration-300'
      : ''}
            ${isFocused || searchTerm
      ? 'ring-2 ring-blue-500 dark:ring-blue-400'
      : 'ring-1 ring-gray-300 dark:ring-gray-400'}
          `}
          onClick={handleSearchBarClick}
        >
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className={`w-4 h-4 ${isFocused ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
            </svg>
          </div>

          <input
            ref={searchInputRef}
            type="search"
            className={`block w-full p-2 pl-10 pr-10 text-sm text-gray-900 border-0 bg-gray-50 focus:ring-0 focus:outline-none dark:bg-gray-700 dark:placeholder-gray-400 dark:text-white ${styles.scrollbarHide}`}
            placeholder={isScrolled ? 'Search...' : 'Search by team, league, or country'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          {/* Clear button */}
          {searchTerm && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={handleClearSearch}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search info - show number of matches when search is active */}
        {searchTerm && (
          <div className={`mt-1 text-xs text-right pr-1 text-gray-500 dark:text-gray-400 ${styles.searchInfo}`}>
            {filteredMatches.length}
            {' '}
            {filteredMatches.length === 1 ? 'match' : 'matches'}
            {' '}
            found
          </div>
        )}
      </div>

      {/* Results container - also hide scrollbars */}
      <div className={styles.scrollbarHide}>
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
                {debouncedSearchTerm
                  ? (
                      <p className="text-foreground/70">
                        No matches found for "
                        {debouncedSearchTerm}
                        "
                      </p>
                    )
                  : (
                      <>
                        <p className="text-foreground/70">No live matches at the moment</p>
                        <p className="text-sm text-muted-foreground mt-1">Check back later for live predictions</p>
                      </>
                    )}
              </div>
            )}
      </div>
    </div>
  )
}
