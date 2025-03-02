'use client'

import type { MatchPrediction } from '@/types'
import { usePredictions } from '@/lib/store/use-predictions'
import { useCallback, useEffect, useRef, useState } from 'react'

// Increase refresh interval from 60s to 2 minutes to reduce API load
const AUTO_REFRESH_INTERVAL = 120000 // 2 minutes
// Minimum time between manual refreshes
const MIN_MANUAL_REFRESH_INTERVAL = 30000 // 30 seconds

/**
 * Custom hook for fetching and managing live predictions data
 * Provides auto-refresh functionality with throttling to prevent excessive API calls
 */
export function useLivePredictions() {
  const {
    predictions,
    lastUpdated,
    isLoading,
    error,
    updatePredictions,
    setLoading,
    setError,
  } = usePredictions()

  const [autoRefresh, setAutoRefresh] = useState(true)
  const lastFetchTimeRef = useRef<number>(0)
  const fetchingRef = useRef<boolean>(false)

  // Function to fetch predictions with throttling
  const fetchPredictions = useCallback(async () => {
    // Prevent concurrent fetches and throttle requests
    const now = Date.now()
    if (
      fetchingRef.current
      || isLoading
      || (now - lastFetchTimeRef.current < MIN_MANUAL_REFRESH_INTERVAL)
    ) {
      return
    }

    try {
      fetchingRef.current = true
      setLoading(true)
      lastFetchTimeRef.current = now

      const response = await fetch('/api/predictions')

      if (!response.ok) {
        throw new Error(`Error fetching predictions: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        updatePredictions(data.data)
      }
      else {
        throw new Error('Invalid response format')
      }
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error fetching predictions')
      console.error('Error fetching predictions:', err)
    }
    finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [isLoading, setLoading, setError, updatePredictions])

  // Fetch on initial load
  useEffect(() => {
    fetchPredictions()
  }, [fetchPredictions])

  // Set up auto-refresh interval with debounce
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchPredictions()
      }, AUTO_REFRESH_INTERVAL)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [autoRefresh, fetchPredictions])

  // Return everything needed to manage predictions
  return {
    predictions,
    lastUpdated,
    isLoading,
    error,
    refresh: fetchPredictions,
    autoRefresh,
    setAutoRefresh,
  }
}

/**
 * Custom hook for fetching a single prediction by ID
 */
export function usePredictionById(id: number) {
  const { predictions, isLoading, error } = usePredictions()
  const [prediction, setPrediction] = useState<MatchPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true)

      try {
        // First check if we already have it in the store
        const existing = predictions.find(p => p.fixtureId === id)

        if (existing) {
          setPrediction(existing)
        }
        else {
          // Otherwise fetch from API
          const response = await fetch(`/api/predictions/${id}`)

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Prediction not found')
            }
            throw new Error(`Error fetching prediction: ${response.status}`)
          }

          const data = await response.json()

          if (data.success && data.data) {
            setPrediction(data.data)
          }
          else {
            throw new Error('Invalid response format')
          }
        }
      }
      catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
        console.error(`Error fetching prediction with ID ${id}:`, err)
      }
      finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [id, predictions])

  return {
    prediction,
    isLoading: loading || isLoading,
    error: errorMsg || error,
    refresh: () => {
      setLoading(true)
      setPrediction(null)
      setErrorMsg(null)
    },
  }
}
