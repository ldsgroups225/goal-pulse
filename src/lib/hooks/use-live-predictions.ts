'use client';

import { useEffect, useState } from 'react';
import { usePredictions } from '@/lib/store/use-predictions';
import { MatchPrediction } from '@/types';

const AUTO_REFRESH_INTERVAL = 60000; // 60 seconds

/**
 * Custom hook for fetching and managing live predictions data
 * Provides auto-refresh functionality
 */
export function useLivePredictions() {
  const { 
    predictions, 
    lastUpdated, 
    isLoading, 
    error, 
    updatePredictions,
    setLoading,
    setError
  } = usePredictions();
  
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Function to fetch predictions
  const fetchPredictions = async () => {
    if (isLoading) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/predictions');
      
      if (!response.ok) {
        throw new Error(`Error fetching predictions: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        updatePredictions(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error fetching predictions');
      console.error('Error fetching predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on initial load
  useEffect(() => {
    fetchPredictions();
  }, []);

  // Set up auto-refresh interval
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchPredictions();
      }, AUTO_REFRESH_INTERVAL);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh]);

  // Return everything needed to manage predictions
  return {
    predictions,
    lastUpdated,
    isLoading,
    error,
    refresh: fetchPredictions,
    autoRefresh,
    setAutoRefresh,
  };
}

/**
 * Custom hook for fetching a single prediction by ID
 */
export function usePredictionById(id: number) {
  const { predictions, isLoading, error } = usePredictions();
  const [prediction, setPrediction] = useState<MatchPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true);
      
      try {
        // First check if we already have it in the store
        const existing = predictions.find(p => p.fixtureId === id);
        
        if (existing) {
          setPrediction(existing);
        } else {
          // Otherwise fetch from API
          const response = await fetch(`/api/predictions/${id}`);
          
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Prediction not found');
            }
            throw new Error(`Error fetching prediction: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success && data.data) {
            setPrediction(data.data);
          } else {
            throw new Error('Invalid response format');
          }
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
        console.error(`Error fetching prediction with ID ${id}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [id, predictions]);

  return {
    prediction,
    isLoading: loading || isLoading,
    error: errorMsg || error,
    refresh: () => {
      setLoading(true);
      setPrediction(null);
      setErrorMsg(null);
    }
  };
}
